from difflib import context_diff
from nl4dv import NL4DV
import os
import json
from flask import Flask, jsonify, request, Blueprint, render_template, abort, send_from_directory
from flask_cors import CORS
from jinja2 import TemplateNotFound

# Import our Example Applications
from examples.applications.datatone import datatone_routes
from examples.applications.vleditor import vleditor_routes
from examples.applications.vllearner import vllearner_routes
from examples.applications.mmplot import mmplot_routes
from examples.applications.mindmap import mindmap_routes
from examples.applications.chatbot import chatbot_routes
from examples.applications.nl4dv_llm import nl4dv_llm_routes

# Import our Debugging Applications
from examples.debuggers.debugger_single import debugger_single_routes
from examples.debuggers.debugger_batch import debugger_batch_routes
from examples.debuggers.vis_matrix import vis_matrix_routes
from examples.debuggers.test_queries import test_queries_routes

# Initialize the app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Initialize nl4dv variable
nl4dv_instance = None

# Auto-initialize NL4DV on startup
def auto_initialize_nl4dv():
    """
    Auto-initialize NL4DV based on environment variables.
    Tries GPT mode first if OPENAI_API_KEY is set, falls back to spacy semantic-parsing.
    """
    global nl4dv_instance

    openai_key = os.environ.get('OPENAI_API_KEY', '')
    processing_mode = os.environ.get('NL4DV_PROCESSING_MODE', 'gpt' if openai_key else 'semantic-parsing')

    try:
        if processing_mode == 'gpt' and openai_key:
            print(f"Auto-initializing NL4DV in GPT mode...")
            nl4dv_instance = NL4DV(processing_mode="gpt", gpt_api_key=openai_key, verbose=True)
            print("NL4DV initialized successfully in GPT mode")
        else:
            print(f"Auto-initializing NL4DV in semantic-parsing mode with spacy...")
            dependency_parser_config = {'name': 'spacy', 'model': 'en_core_web_sm', 'parser': None}
            nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")
            print("NL4DV initialized successfully in semantic-parsing mode")
    except Exception as e:
        print(f"Warning: Auto-initialization failed: {e}")
        print("NL4DV will need to be initialized manually via /init endpoint")
        nl4dv_instance = None

# Initialize on module load
auto_initialize_nl4dv()

@app.route('/init', methods=['POST'])
def init():
    global nl4dv_instance

    if 'processing_mode' not in request.form:
        request.form['processing_mode'] = 'semantic-parsing'

    processing_mode = request.form['processing_mode']
    if processing_mode == "gpt":
            openai_key = request.form['openAIKey']
            nl4dv_instance = NL4DV(processing_mode="gpt", gpt_api_key=openai_key, verbose=True)

    elif processing_mode == "semantic-parsing":
        dependency_parser = request.form['dependency_parser']
        if dependency_parser == "corenlp":
            dependency_parser_config = {'name': 'corenlp','model': os.path.join("assets","jars","stanford-english-corenlp-2018-10-05-models.jar"),'parser': os.path.join("assets","jars","stanford-parser.jar")}
            nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")

        elif dependency_parser == "spacy":
            dependency_parser_config = {'name': 'spacy','model': 'en_core_web_sm','parser': None}
            nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")

        elif dependency_parser == "corenlp-server":
            dependency_parser_config = {'name': 'corenlp-server','url': 'http://localhost:9000'}
            nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")

        else:
            raise ValueError('Error with Dependency Parser')
    else:
        raise ValueError('Error with Processing Mode')

    return jsonify({"message":"NL4DV Initialized"})


@app.route('/setDependencyParser', methods=['POST'])
def setDependencyParser():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    dependency_parser = request.form['dependency_parser']
    if dependency_parser == "corenlp":
        dependency_parser_config = {'name': 'corenlp','model': os.path.join("assets","jars","stanford-english-corenlp-2018-10-05-models.jar"),'parser': os.path.join("assets","jars","stanford-parser.jar")}
        nl4dv_instance.set_dependency_parser(config=dependency_parser_config)

    elif dependency_parser == "spacy":
        dependency_parser_config = {'name': 'spacy','model': 'en_core_web_sm','parser': None}
        nl4dv_instance.set_dependency_parser(config=dependency_parser_config)

    elif dependency_parser == "corenlp-server":
        dependency_parser_config = {'name': 'corenlp-server','url': 'http://localhost:9000'}
        nl4dv_instance.set_dependency_parser(config=dependency_parser_config)
    else:
        raise ValueError('Data not provided')


@app.route('/setData', methods=['POST'])
def setData():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    dataset = request.form['dataset']
    if dataset is not None:
        datafile_obj = dataset.rsplit(".")
        nl4dv_instance.set_data(data_url=os.path.join("assets", "data", datafile_obj[0] + ".csv"))
        nl4dv_instance.set_alias_map(alias_url=os.path.join("assets", "aliases", datafile_obj[0] + ".json"))
        return get_dataset_meta()
    else:
        raise ValueError('Data not provided')

@app.route('/setIgnoreList', methods=['POST'])
def setIgnoreList():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    ignore_words = request.form['ignore_words']
    nl4dv_instance.set_ignore_words(ignore_words=json.loads(ignore_words))
    return jsonify({'message': 'Ignore List Set successfully'})


@app.route('/setThresholds', methods=['POST'])
def setThresholds():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    thresholds_str = request.form['thresholds']
    try:
        thresholds = json.loads(thresholds_str)
        response = nl4dv_instance.set_thresholds(thresholds)
        return jsonify({'message': 'Thresholds Set successfully'})
    except:
        raise ValueError('Thresholds not a JSON string')


@app.route('/setImportanceScores', methods=['POST'])
def setImportanceScores():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    scores_str = request.form['importance_scores']
    try:
        scores = json.loads(scores_str)
        response = nl4dv_instance.set_importance_scores(scores)
        return jsonify({'message': 'Scores Set successfully'})

    except Exception:
        raise ValueError('Importance Scores not a JSON string')


@app.route('/update_query', methods=['POST'])
def update_query():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    ambiguity_obj = request.get_json()
    return json.dumps(nl4dv_instance.update_query(ambiguity_obj))


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "initialized": nl4dv_instance is not None
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Simplified analyze endpoint that handles initialization automatically.
    Accepts JSON body with 'query' and 'dataset' parameters.
    """
    global nl4dv_instance

    # Auto-initialize if not already done
    if nl4dv_instance is None:
        auto_initialize_nl4dv()
        if nl4dv_instance is None:
            return jsonify({
                "error": "NL4DV could not be initialized. Set OPENAI_API_KEY environment variable or call /init endpoint.",
                "status": "FAILURE"
            }), 500

    # Get JSON data
    data = request.get_json()
    if not data:
        return jsonify({
            "error": "Request body must be JSON with 'query' and 'dataset' fields",
            "status": "FAILURE"
        }), 400

    query = data.get('query')
    dataset = data.get('dataset')
    debug = data.get('debug', False)

    if not query:
        return jsonify({
            "error": "'query' field is required",
            "status": "FAILURE"
        }), 400

    if not dataset:
        return jsonify({
            "error": "'dataset' field is required",
            "status": "FAILURE"
        }), 400

    try:
        # Set dataset
        datafile_obj = dataset.rsplit(".")
        data_path = os.path.join("examples", "assets", "data", datafile_obj[0] + ".csv")
        alias_path = os.path.join("examples", "aliases", datafile_obj[0] + ".json")

        nl4dv_instance.set_data(data_url=data_path)
        if os.path.exists(alias_path):
            nl4dv_instance.set_alias_map(alias_url=alias_path)

        # Analyze query
        result = nl4dv_instance.analyze_query(query, debug=debug)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "FAILURE"
        }), 500


@app.route('/analyze_query', methods=['POST'])
def analyze_query():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    query = request.form['query']
    # print(request.form['dialog'])
    dialog = True if 'dialog' in request.form and request.form['dialog'] == 'true' else False
    if 'dialog' in request.form and request.form['dialog'] == "auto":
        dialog = "auto"

    if dialog is True:
        dialog_id = request.form['dialog_id']
        query_id = int(request.form['query_id'])

        return json.dumps(nl4dv_instance.analyze_query(query, dialog=dialog, dialog_id=dialog_id, query_id=query_id, debug=True))

    if dialog == "auto":
        return json.dumps(nl4dv_instance.analyze_query(query, dialog=dialog, debug=True))

    return json.dumps(nl4dv_instance.analyze_query(query, debug=True))


@app.route('/flushConversation', methods=['POST'])
def flushConversation():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    query_id = request.form['query_id']
    dialog_id = request.form['dialog_id']
    try:
        nl4dv_instance.delete_dialogs(dialog_id=dialog_id, query_id=query_id)
    except Exception as e:
        return jsonify({"message": "Some error occurred flushing the conversation."})
    return jsonify({"message": "Conversation flushed."})


@app.route('/flushAllConversations', methods=['POST'])
def flushAllConversations():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    try:
        nl4dv_instance.delete_dialogs(dialog_id=None, query_id=None)
    except Exception as e:
        return jsonify({"message": "Some error occurred flushing all conversations."})
    return jsonify({"message": "All conversations flushed."})

@app.route('/setAttributeDataType', methods=['POST'])
def setAttributeDataType():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    attr_type_obj = request.form['attr_type_obj']
    nl4dv_instance.set_attribute_datatype(json.loads(attr_type_obj))
    return get_dataset_meta()


@app.route('/',methods=['GET'])
def application_homepage():
    """API documentation homepage"""
    api_key_set = bool(os.environ.get('OPENAI_API_KEY'))
    initialized = nl4dv_instance is not None

    return jsonify({
        "message": "NL4DV Chart Generation API",
        "version": "1.0.0",
        "status": {
            "initialized": initialized,
            "openai_api_key_set": api_key_set,
            "processing_mode": "gpt" if api_key_set else "semantic-parsing"
        },
        "endpoints": {
            "GET /": "API documentation (this page)",
            "GET /health": "Health check",
            "POST /analyze": "Simplified endpoint - analyze query with auto-init (recommended)",
            "POST /init": "Manual initialization (optional if auto-init succeeded)",
            "POST /setData": "Set dataset",
            "POST /analyze_query": "Full-featured query analysis",
            "POST /update_query": "Update query with ambiguity resolution",
            "POST /flushConversation": "Clear conversation history",
            "POST /flushAllConversations": "Clear all conversations"
        },
        "usage_example": {
            "endpoint": "/analyze",
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "body": {
                "query": "Show revenue by month",
                "dataset": "movies-w-year.csv"
            }
        },
        "available_datasets": [
            "movies-w-year.csv",
            "olympic_medals.csv",
            "cars-w-year.csv",
            "colleges.csv",
            "euro.csv",
            "housing.csv",
            "superstore.csv"
        ]
    })


def get_dataset_meta():
    global nl4dv_instance
    dataset_meta = nl4dv_instance.get_metadata()
    output = {
        "summary": dataset_meta,
        "rowCount": nl4dv_instance.data_genie_instance.rows,
        "columnCount": len(dataset_meta.keys())
    }
    return jsonify(output)

@app.route('/examples/assets/<path:filename>')
def serve_examples_assets(filename):
    """
    Serve example data files and assets.
    This route makes CSV/JSON data files accessible to Vega-Embed in the frontend.
    Example: /examples/assets/data/cars-w-year.csv
    """
    return send_from_directory(
        os.path.join(os.getcwd(), 'examples', 'assets'),
        filename,
        conditional=True
    )

if __name__ == "__main__":
    # UI applications disabled - API-only mode
    # To enable UI applications, uncomment the desired blueprints below:

    # app.register_blueprint(datatone_routes.datatone_bp, url_prefix='/datatone')
    # app.register_blueprint(vleditor_routes.vleditor_bp, url_prefix='/vleditor')
    # app.register_blueprint(vllearner_routes.vllearner_bp, url_prefix='/vllearner')
    # app.register_blueprint(mmplot_routes.mmplot_bp, url_prefix='/mmplot')
    # app.register_blueprint(mindmap_routes.mindmap_bp, url_prefix='/mindmap')
    # app.register_blueprint(chatbot_routes.chatbot_bp, url_prefix='/chatbot')
    # app.register_blueprint(nl4dv_llm_routes.nl4dv_llm_bp, url_prefix='/nl4dv_llm')

    # Debugger applications (also disabled)
    # app.register_blueprint(debugger_single_routes.debugger_single_bp, url_prefix='/debugger_single')
    # app.register_blueprint(debugger_batch_routes.debugger_batch_bp, url_prefix='/debugger_batch')
    # app.register_blueprint(vis_matrix_routes.vis_matrix_bp, url_prefix='/vis_matrix')
    # app.register_blueprint(test_queries_routes.test_queries_bp, url_prefix='/test_queries')

    port = int(os.environ.get("PORT", 7001))
    print(f"\n{'='*60}")
    print(f"NL4DV Chart Generation API")
    print(f"{'='*60}")
    print(f"Server starting on http://0.0.0.0:{port}")
    print(f"API Documentation: http://localhost:{port}/")
    print(f"Health Check: http://localhost:{port}/health")
    print(f"\nAPI-Only Mode (UI applications disabled)")
    print(f"Use the /analyze endpoint for simplified query analysis")
    print(f"{'='*60}\n")

    app.run(host='0.0.0.0', debug=True, threaded=True, port=port)

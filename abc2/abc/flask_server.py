from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from flask_cors import  CORS
import threading

from expert_technical_interviewer_f04TV7hdF9tk2UQyPV3zIpKDIo7qr5 import ExpertTechnicalInterviewer

app = Flask(__name__)
CORS(app)

interviewer = None
interview_state = {
    'active': False,
    'stage': 'greeting',
    'current_question': None,
    'conversation_history': [],
    'skill_questions_asked': 0,
    'coding_questions_asked': 0,
    'personal_info_collected': False,
    'tech_background_collected': False,
    'skills_collected': '',
    'current_domain': None
}

def initialize_interviewer():
    global interviewer
    try:
        interviewer = ExpertTechnicalInterviewer(accent="indian")
        return True
    except Exception as e:
        print(f"Failed to initialize interviewer: {e}")
        return False

@app.route('/api/start-interview', methods=['POST'])
def start_interview():
    global interviewer, interview_state

    if not initialize_interviewer():
        return jsonify({'error': 'Failed to initialize interviewer'}), 500

    # Reset interview state
    interview_state.update({
        'active': True,
        'stage': 'greeting',
        'conversation_history': [],
        'skill_questions_asked': 0,
        'coding_questions_asked': 0,
        'personal_info_collected': False,
        'tech_background_collected': False,
        'skills_collected': '',
        'current_domain': None,
        'current_question': None
    })

    welcome_msg = "Hello! I am Gyani, your technical interviewer. Welcome to your interview session today. Let's begin - could you please tell me a bit about yourself?"
    
    try:
        import threading
        threading.Thread(target=interviewer.start_interview, daemon=True).start()
    except Exception as e:
        print(f"🔥 Interview launch error: {e}")
        return jsonify({'error': 'Failed to launch interview thread'}), 500

    return jsonify({
        'status': 'started',
        'message': welcome_msg,
        'interview_active': True,
        'stage': 'greeting'
    })

@app.route('/api/process-speech', methods=['POST'])
def process_speech():
    global interviewer, interview_state

    if not interviewer:
        return jsonify({'error': 'Interviewer not initialized'}), 400

    data = request.json
    user_input = data.get('text', '').strip()

    if not user_input:
        return jsonify({'error': 'No speech input provided'}), 400

    try:
        interview_state['conversation_history'].append({'role': 'user', 'content': user_input})
        response = ""

        if user_input.lower() == "done_coding":
            interview_state['stage'] = 'concluded'
            interview_state['active'] = False
            response = (
                "🎉 Great job on the coding challenge! That concludes our interview. "
                "Thank you for your time, and best of luck!"
            )

        elif interview_state['stage'] == 'greeting':
            interview_state['personal_info_collected'] = True
            interview_state['stage'] = 'tech_background'
            response = "Thanks for the intro! Tell me more about your technical background."

        elif interview_state['stage'] == 'tech_background':
            interview_state['tech_background_collected'] = True
            interview_state['skills_collected'] = user_input

            try:
                interview_state['current_domain'] = interviewer._identify_tech_domain(user_input) or 'general'
            except:
                interview_state['current_domain'] = 'general'

            interview_state['stage'] = 'skill_questions'
            interview_state['skill_questions_asked'] = 1
            try:
                question = interviewer._add_domain_specific_followup(interview_state['current_domain'])
            except:
                question = "Can you explain the difference between a list and a dictionary in Python?"
            response = f"Great! Let's begin your technical round.\n\n{question}"

        elif interview_state['stage'] == 'skill_questions':
            if interview_state['skill_questions_asked'] < 3:
                interview_state['skill_questions_asked'] += 1
                if interview_state['skill_questions_asked'] < 3:
                    try:
                        question = interviewer._add_domain_specific_followup(interview_state['current_domain'])
                    except:
                        question = "Can you explain how you'd improve performance in a SQL query?"
                    response = f"Good answer! Here's another question:\n\n{question}"
                else:
                    # Transition to coding challenges
                    interview_state['stage'] = 'coding_challenges'
                    interview_state['coding_questions_asked'] = 1
                    interview_state['current_question'] = interviewer.current_coding_question
                    response = (
                        "✅ You've done well with theory!\n\n"
                        "🧠 Please go to the code editor to demonstrate your coding skills."
                    )
                    if user_input.lower() == "done_coding":
                        interview_state['stage'] = 'concluded'
                        interview_state['active'] = False
                        response = (
                            "🎉 Great job on the coding challenge! That concludes our interview. "
                            "Thank you for your time, and best of luck!"
                        )

                        try:
                            interviewer.speak(response, interruptible=False)
                        except Exception as e:
                            print(f"TTS error: {e}")

                        interview_state['conversation_history'].append({'role': 'assistant', 'content': response})

                        return jsonify({
                            'response': response,
                            'status': 'ended',
                            'stage': interview_state['stage'],
                            'questions_asked': interview_state['skill_questions_asked'],
                            'coding_challenges_asked': interview_state['coding_questions_asked']
                        })


        elif interview_state['stage'] == 'coding_challenges':
            if interview_state['coding_questions_asked'] == 1:
                interview_state['coding_questions_asked'] += 1
                response = "Great attempt! Now go ahead and complete the second coding challenge in the editor."
            else:
                response = "✅ You're doing well! Finish your code and submit it when you're ready."

        elif interview_state['stage'] == 'concluded':
            response = "📌 The interview has already ended. Thank you!"

        try:
            interviewer.speak(response, interruptible=False)
        except Exception as e:
            print(f"TTS error: {e}")

        interview_state['conversation_history'].append({'role': 'assistant', 'content': response})

        return jsonify({
            'response': response,
            'status': 'ended' if interview_state['stage'] == 'concluded' else 'ok',
            'stage': interview_state['stage'],
            'questions_asked': interview_state['skill_questions_asked'],
            'coding_challenges_asked': interview_state['coding_questions_asked']
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/interview-status', methods=['GET'])
def get_interview_status():
    """Get current interview status and progress"""
    return jsonify({
        'active': interview_state['active'],
        'stage': interview_state['stage'],
        'skill_questions_asked': interview_state['skill_questions_asked'],
        'coding_questions_asked': interview_state['coding_questions_asked'],
        'total_skill_questions': 3,  # Fixed: Changed from 7 to 3
        'total_coding_questions': 2,
        'current_domain': interview_state.get('current_domain', 'unknown')
    })

@app.route('/api/end-interview', methods=['POST'])
def end_interview():
    """Manually end the interview"""
    global interview_state
    
    interview_state['active'] = False
    interview_state['stage'] = 'concluded'
    
    return jsonify({
        'status': 'ended',
        'message': 'Interview has been ended manually.'
    })

@app.route('/api/current-coding-question', methods=['GET'])
def get_current_coding_question():
    if interview_state['stage'] != 'coding_challenges':
        return jsonify({
            'question': None, 
            'error': f'Not in coding stage. Current stage: {interview_state["stage"]}'
        }), 400
    
    return jsonify({
        'question': interview_state.get('current_question', 'No coding question assigned yet.'),
        'stage': interview_state['stage'],
        'coding_questions_asked': interview_state['coding_questions_asked']
    })

@app.route('/api/submit-code', methods=['POST'])
def submit_code():
    data = request.get_json()
    user_code = data.get("code", "")
    language = data.get("language", "python")  # Optional

    # Call evaluation logic
    success, output, followup = evaluate_code_and_respond(user_code, language)

    return jsonify({
        "success": success,
        "output": output,
        "followup_question": followup
    })

def evaluate_code_and_respond(code: str, language: str):
    try:
        # Only for Python code execution (unsafe in production!)
        # Redirect stdout to capture print output
        import io
        import contextlib

        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            exec(code, {}, {})  # Execute in empty namespace

        printed_output = buffer.getvalue().strip()
        expected_output = "Hello, World!"

        if expected_output in printed_output:
            followup = "✅ Great! Now modify the function to take a name and print 'Hello, <name>!'"
            return True, printed_output, followup
        else:
            return False, printed_output, "⚠️ Try printing exactly 'Hello, World!'."

    except Exception as e:
        return False, "", f"❌ Error during execution: {str(e)}"

# Debug endpoint to check interview state
@app.route('/api/debug-state', methods=['GET'])
def debug_state():
    """Debug endpoint to inspect current interview state"""
    return jsonify(interview_state)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
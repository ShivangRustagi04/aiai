from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from flask_cors import  CORS
import datetime
from datetime import timedelta
import secrets
import smtplib
from email.mime.text import MIMEText
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

@app.route('/api/problems/random', methods=['GET'])
def get_random_problem():
    problems = [
        "Write a function to reverse a string.",
        "Find the factorial of a number using recursion.",
        "Implement binary search on a sorted list."
    ]
    return jsonify({
        "question": random.choice(problems)
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

    # ✅ Force move to coding stage (manual trigger)
    if user_input.lower() == "ready_for_coding":
        interview_state['stage'] = 'coding_challenges'
        interview_state['coding_questions_asked'] = 1
        try:
            coding_question = interviewer._generate_coding_question(
                interview_state.get("current_domain", "python")
            )
            interview_state['current_question'] = coding_question
            print(f"🧐 Generated coding question: {coding_question}")
        except Exception as e:
            print(f"Error generating coding question: {e}")
            interview_state['current_question'] = "Write a function that takes a string and returns it reversed. For example, 'hello' should return 'olleh'."

        return jsonify({
            "response": "✅ Great! Now let's move to the coding challenge. Please use the code editor to solve the problem.",
            "question": interview_state["current_question"],
            "stage": interview_state["stage"]
        })

    # ✅ Handle code submission and transition to doubt clearing
    if user_input.lower() == "done_coding":
        try:
            latest_code = interview_state.get("latest_code", "")
            language = interview_state.get("language", "python")

            if latest_code:
                interviewer.submit_candidate_code(latest_code)

            interview_state['stage'] = 'doubt_clearing'
            response = "Thanks for your submission. Now let's move to any questions or clarifications you might have."
            interview_state['active'] = True  # make sure interview stays active

        # ✅ Launch doubt-clearing in separate thread
            try:
                import threading
                threading.Thread(
                    target=interviewer._conduct_doubt_clearing,
                    args=(True,),  # False if professional interview
                    daemon=True
                ).start()
            except Exception as e:
                print(f"❌ Failed to launch doubt-clearing: {e}")

        except Exception as e:
            print(f"Code submission error: {e}")
            response = "Thanks for submitting. Let's move to the next part of the interview."

        try:
            interviewer.speak(response, interruptible=False)
        except Exception as e:
            print(f"TTS error: {e}")

        interview_state['conversation_history'].append({'role': 'assistant', 'content': response})

        return jsonify({
            'response': response,
            'status': 'ok',
            'stage': interview_state['stage'],
            'questions_asked': interview_state['skill_questions_asked'],
            'coding_challenges_asked': interview_state['coding_questions_asked']
        })

    try:
        interview_state['conversation_history'].append({'role': 'user', 'content': user_input})
        response = ""

        if interview_state['stage'] == 'greeting':
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
                    interview_state['stage'] = 'coding_challenges'
                    interview_state['coding_questions_asked'] = 1
                    try:
                        coding_question = interviewer._generate_coding_question(
                            interview_state.get("current_domain", "general")
                        )
                        interview_state['current_question'] = coding_question
                        print(f"🧐 Auto-generated coding question: {coding_question}")
                    except Exception as e:
                        print(f"Error generating coding question: {e}")
                        interview_state['current_question'] = "Write a function that takes a string and returns it reversed. For example, 'hello' should return 'olleh'."

                    response = (
                        "✅ You've done well with theory!\n\n"
                        "🧠 Please go to the code editor to demonstrate your coding skills."
                    )

        elif interview_state['stage'] == 'coding_challenges':
            if interview_state['coding_questions_asked'] == 1:
                interview_state['coding_questions_asked'] += 1
                response = "Great attempt! Now go ahead and complete the second coding challenge in the editor."
            else:
                response = "✅ You're doing well! Finish your code and submit it when you're ready."

        elif interview_state['stage'] == 'concluded':
            response = "📌 The interview has already ended. Thank you!"

        interviewer.speak(response, interruptible=False)

    except Exception as e:
        print(f"Error: {str(e)}")
        response = "⚠️ Something went wrong, but let's continue."

    interview_state['conversation_history'].append({'role': 'assistant', 'content': response})

    return jsonify({
        'response': response,
        'status': 'ok',
        'stage': interview_state['stage'],
        'questions_asked': interview_state['skill_questions_asked'],
        'coding_challenges_asked': interview_state['coding_questions_asked'],
        'current_question': interview_state.get('current_question')
    })
interview_state['interview_links'] = {} 

@app.route('/api/generate-interview-link', methods=['POST'])
def generate_interview_link():
    data = request.json
    recipient_email = data.get('email')
    
    if not recipient_email:
        return jsonify({'error': 'Recipient email is required'}), 400
    
    token = secrets.token_urlsafe(32)
    
    expiration_date = datetime.datetime.now() + timedelta(days=7)
    
    interview_state['interview_links'][token] = {
        'email': recipient_email,
        'expires_at': expiration_date.isoformat(),
        'used': False,
        'created_at': datetime.datetime.now().isoformat()
    }
    
    interview_link = f"https://yourdomain.com/interview/{token}"
    
    try:
        send_interview_link_email(recipient_email, interview_link, expiration_date)
        return jsonify({
            'status': 'success',
            'message': 'Interview link sent successfully',
            'expires_at': expiration_date.isoformat()
        })
    except Exception as e:
        return jsonify({
            'error': f'Failed to send email: {str(e)}',
            'interview_link': interview_link 
        }), 500

def send_interview_link_email(recipient, link, expires_at):
    """Helper function to send interview link email"""
    SMTP_SERVER = "your_smtp_server.com"
    SMTP_PORT = 587
    SMTP_USERNAME = "your_email@example.com"
    SMTP_PASSWORD = "your_email_password"
    SENDER_EMAIL = "no-reply@yourdomain.com"
    
    subject = "Your Technical Interview Link"
    body = f"""
    <p>Hello,</p>
    <p>Here is your interview link: <a href="{link}">{link}</a></p>
    <p>This link will expire on {expires_at.strftime('%Y-%m-%d %H:%M:%S')}.</p>
    <p>Please complete your interview before this date.</p>
    <p>Best regards,<br>Interview Team</p>
    """
    
    msg = MIMEText(body, 'html')
    msg['Subject'] = subject
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient
    
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)

@app.route('/api/validate-interview-link/<token>', methods=['GET'])
def validate_interview_link(token):
    """Endpoint to validate an interview link"""
    if token not in interview_state['interview_links']:
        return jsonify({'valid': False, 'reason': 'Invalid token'}), 404
    
    link_data = interview_state['interview_links'][token]
    expiration_date = datetime.datetime.fromisoformat(link_data['expires_at'])
    
    if datetime.datetime.now() > expiration_date:
        return jsonify({'valid': False, 'reason': 'Link expired'}), 410
    
    if link_data['used']:
        return jsonify({'valid': False, 'reason': 'Link already used'}), 403
    
    return jsonify({
        'valid': True,
        'expires_at': link_data['expires_at'],
        'email': link_data['email']
    })

@app.route('/api/mark-link-used/<token>', methods=['POST'])
def mark_link_used(token):
    """Mark an interview link as used"""
    if token not in interview_state['interview_links']:
        return jsonify({'error': 'Invalid token'}), 404
    
    interview_state['interview_links'][token]['used'] = True
    return jsonify({'status': 'success'})
@app.route('/api/interview-status', methods=['GET'])
def get_interview_status():
    """Get current interview status and progress"""
    return jsonify({
        'active': interview_state['active'],
        'stage': interview_state['stage'],
        'skill_questions_asked': interview_state['skill_questions_asked'],
        'coding_questions_asked': interview_state['coding_questions_asked'],
        'total_skill_questions': 3,
        'total_coding_questions': 2,
        'current_domain': interview_state.get('current_domain', 'unknown'),
        'current_question': interview_state.get('current_question')
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
    
    current_question = interview_state.get('current_question')
    if not current_question:
        # Generate a fallback question if none exists
        try:
            current_question = interviewer._generate_coding_question(
                interview_state.get("current_domain", "python")
            )
            interview_state['current_question'] = current_question
        except:
            current_question = "Write a function that takes a string and returns it reversed. For example, 'hello' should return 'olleh'."
            interview_state['current_question'] = current_question
    
    return jsonify({
        'question': current_question,
        'stage': interview_state['stage'],
        'coding_questions_asked': interview_state['coding_questions_asked']
    })

@app.route('/api/submit-code', methods=['POST'])
def submit_code():
    data = request.get_json()
    user_code = data.get("code", "")
    language = data.get("language", "python")

    # Save code and language in global state
    interview_state['latest_code'] = user_code
    interview_state['language'] = language

    try:
        # 🔧 Run code using backend method (safe execution)
        output = interviewer._execute_code(language, user_code)

        # 🤖 Generate follow-up question using Gemini
        followup = interviewer._coding_followup(user_code, language)

        success = True
    except Exception as e:
        output = ""
        followup = f"❌ Error while running code: {str(e)}"
        success = False

    return jsonify({
        "success": success,
        "output": output,
        "followup_question": followup
    })


@app.route("/api/generate-coding-question", methods=["POST"])
def api_generate_coding_question():
    data = request.get_json()
    domain = data.get("domain", "python")
    session_id = data.get("session_id", "default")

    try:
        question = interviewer._generate_coding_question(domain)
        return jsonify({"question": question})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Debug endpoint to check interview state
@app.route('/api/debug-state', methods=['GET'])
def debug_state():
    """Debug endpoint to inspect current interview state"""
    return jsonify(interview_state)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# shared_state.py

from datetime import datetime

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
    'current_domain': None,
    'interview_links': {}
}

def save_to_conversation_history(role, content):
    entry = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    }
    interview_state["conversation_history"].append(entry)

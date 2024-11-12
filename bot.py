import os
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackContext, MessageHandler, filters
from dotenv import load_dotenv
import json
import logging

# Load environment variables
load_dotenv()

# Get token from environment variable
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://ody.pumpdao.fun')

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Store user game states
user_states = {}

async def start(update: Update, context: CallbackContext) -> None:
    """Send a message with a button that opens the web app."""
    keyboard = [[InlineKeyboardButton(
        "Start Journey",
        web_app=WebAppInfo(url=WEBAPP_URL)
    )]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🏺 Welcome to Odyssey Finance!\n\n"
        "Embark on an epic journey through ancient Greece, where your financial "
        "wisdom will be tested by the gods themselves.\n\n"
        "Click the button below to begin your odyssey:",
        reply_markup=reply_markup
    )

async def handle_webapp_data(update: Update, context: CallbackContext) -> None:
    """Save the user's game state."""
    try:
        data = json.loads(update.web_app_data.data)
        user_id = update.effective_user.id
        user_states[user_id] = data
        
        # Format the game state message
        gold = data.get('gold', 0)
        inventory = data.get('inventory', [])
        powerups = data.get('powerups', {})
        
        message = (
            "🎮 Game Progress Saved!\n\n"
            f"💰 Gold: {gold}\n"
            f"🎒 Items: {', '.join(inventory) if inventory else 'None'}\n"
            "⚡ Power-ups:\n"
        )
        
        for powerup, value in powerups.items():
            message += f"  • {powerup}: {value}\n"
        
        keyboard = [[InlineKeyboardButton(
            "Continue Journey",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}?state={user_id}")
        )]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(message, reply_markup=reply_markup)
        logger.info(f"Saved game state for user {user_id}")
    except Exception as e:
        logger.error(f"Error saving game state: {e}")
        await update.message.reply_text(
            "⚠️ Failed to save game state. Please try again."
        )

async def load_game_state(update: Update, context: CallbackContext) -> None:
    """Load the user's game state."""
    user_id = update.effective_user.id
    if user_id in user_states:
        state_data = user_states[user_id]
        keyboard = [[InlineKeyboardButton(
            "Resume Journey",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}?state={user_id}")
        )]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "🎮 Found your saved progress! Click below to continue your odyssey:",
            reply_markup=reply_markup
        )
    else:
        await update.message.reply_text(
            "🔍 No saved game found. Use /start to begin a new journey!"
        )

def main() -> None:
    """Start the bot."""
    if not TOKEN:
        logger.error("No token provided!")
        return

    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("load", load_game_state))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))

    logger.info("Bot started!")
    application.run_polling()

if __name__ == '__main__':
    main()
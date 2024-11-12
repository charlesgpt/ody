import os
import json
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder, CommandHandler, MessageHandler, CallbackContext, filters
)
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://ody.pumpdao.fun/')

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Store user game states
user_states = {}

# Define the start command handler
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

# Define the handler for incoming web app data
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
            message += f"  - {powerup}: {value}\n"

        await update.message.reply_text(message)
    except Exception as e:
        logger.error(f"Error processing web app data: {e}")
        await update.message.reply_text("An error occurred while saving your progress.")

# Main function to set up and run the bot
async def main():
    # Create the application and pass in the bot token
    app = ApplicationBuilder().token(TOKEN).build()
    
    # Add command and message handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))
    
    # Run the bot until interrupted
    await app.run_polling()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Audio handling
const backgroundMusic = document.getElementById('background-music');
if (backgroundMusic) {
    backgroundMusic.volume = 0.5;
    backgroundMusic.loop = true;
    backgroundMusic.muted = false;
}

function initializeAudio() {
    const buttonSound = new Audio('/click.mp3');
    buttonSound.volume = 0.5;
    if (backgroundMusic) {
        backgroundMusic.play().catch(() => {
            debug('Autoplay failed - waiting for user interaction');
        });
    }
}


function startGameWithMusic() {
    if (backgroundMusic) {
        backgroundMusic.play().then(() => {
            debug('Background music started');
            showScreen('intro-scene');
        }).catch(error => {
            debug('Error playing music:', error);
            // Continue to next screen even if music fails
            showScreen('intro-scene');
        });
    } else {
        debug('Background music element not found');
        showScreen('intro-scene');
    }
}

// Play button click sound effect
function playButtonSound() {
    try {
        const buttonSound = new Audio('/click.mp3');
        buttonSound.volume = 0.5;
        buttonSound.play();
    } catch (error) {
        debug('Error playing button sound:', error);
    }
}

// Add sound to all button clicks
document.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.classList.contains('start-button')) {
        playButtonSound();
    } 
});

// Game state
let gameState = {
    currentScreen: 'welcome-screen',
    gold: 0,
    items: [],
    coinFlipsRemaining: 2,
    riskScore: 0,
    canRoll: true,
    canFlip: true,
    inventory: new Set(),
    powerups: {
        tradingPower: 0,
        lossReduction: 0,
        accuracy: 0,
        volatilityControl: 0
    }
};

// Dice rolling functionality
function updateGoldDisplay() {
    const goldDisplayElements = document.querySelectorAll('.gold-amount, #gold-amount');
    if (goldDisplayElements.length > 0) {
        goldDisplayElements.forEach(display => display.textContent = gameState.gold);
        debug(`Updated gold display to: ${gameState.gold}`);
    }
}

function flipCoin() {
    if (!gameState.canFlip) return;
    
    if (gameState.coinFlipsRemaining <= 0) {
        debug('No more coin flips remaining, transitioning to shop...');
        alert('You have used all your coin flips! Moving to the next stage...');
        setTimeout(() => showScreen('shop'), 500);
        return;
    }
    const betAmount = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > gameState.gold) {
        alert('Please enter a valid bet amount');
        return;
    }
    
    gameState.canFlip = false;
    const coin = document.getElementById('coin');
    const flipButton = document.getElementById('flip-coin');
    flipButton.disabled = true;
    
    coin.classList.add('flipping');
    
    setTimeout(() => {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const winnings = result === 'heads' ? betAmount * 2 : -betAmount;
        gameState.gold += winnings;
        
        const resultMessage = `You ${winnings > 0 ? 'won' : 'lost'} ${Math.abs(winnings)} gold!`;
        alert(resultMessage);
        
        updateGoldDisplay();
        coin.classList.remove('flipping');
        gameState.canFlip = true;
        flipButton.disabled = false;
        
        gameState.coinFlipsRemaining--;
        if (gameState.coinFlipsRemaining === 0) {
            setTimeout(() => {
                debug('Last coin flip completed, transitioning to shop...');
                alert('Moving to the Merchant\'s Shop...');
                setTimeout(() => showScreen('shop'), 500);
            }, 1000);
        }
    }, 3000);
}

function rollDice() {
    if (!gameState.canRoll) return;

    gameState.canRoll = false;
    const dice = document.querySelector('.dice');
    const rollButton = document.getElementById('roll-dice');

    if (!dice || !rollButton) return;

    rollButton.disabled = true;

    // Random rotations for realistic effect
    const rotations = {
        x: Math.floor(Math.random() * 10) * 360 + Math.floor(Math.random() * 6) * 90,
        y: Math.floor(Math.random() * 10) * 360 + Math.floor(Math.random() * 6) * 90,
        z: Math.floor(Math.random() * 10) * 360
    };

    dice.style.transition = 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)';
    dice.style.transform = `rotateX(${rotations.x}deg) rotateY(${rotations.y}deg) rotateZ(${rotations.z}deg)`;
    debug('Starting dice roll animation');
    const oracleBonesScreen = document.querySelector('#oracle-bones.active');

    setTimeout(() => {
        debug('Dice roll animation completed');
        const result = Math.floor(Math.random() * 6) + 1;
        gameState.diceResult = result;
        const previousGold = gameState.gold;
        const earnedGold = result * 100;
        gameState.gold = previousGold + earnedGold;
        debug(`Rolled ${result}, earned ${earnedGold} gold`);

        const resultMessage = document.createElement('div');
        resultMessage.className = 'result-message';
        resultMessage.textContent = `You earned ${earnedGold} gold!`;
        oracleBonesScreen.appendChild(resultMessage);
        debug('Result message displayed');
        
        setTimeout(() => {
            debug('Starting transition sequence');
            resultMessage.remove();
            dice.style.transition = 'none';
            dice.style.transform = 'rotateX(0) rotateY(0) rotateZ(0)';
            gameState.canRoll = true;
            rollButton.disabled = false;
            
            // Show Zeus instructions screen
            debug('Transitioning to Zeus instructions screen');
            showScreen('zeus-instructions');
            
            // Update gold display for coin-flip screen
            const goldDisplay = document.querySelector('#gold-amount');
            if (goldDisplay) {
                goldDisplay.textContent = gameState.gold;
            }
        }, 1500);
    }, 3000);
}

// Debug logging function
function debug(message) {
    console.log(`[Debug] ${message}`);
}

// Screen transition function
function showScreen(screenId) {
    debug(`Transitioning to screen: ${screenId}`);
    debug(`Current screen: ${gameState.currentScreen}`);
    debug(`Screen exists: ${!!document.getElementById(screenId)}`);
    const currentScreen = document.querySelector('.screen.active') || document.getElementById('welcome-screen');
    if (currentScreen) {
        currentScreen.style.transition = 'opacity 0.8s ease-out';
        currentScreen.style.opacity = '0';
        currentScreen.style.transform = 'scale(1.1)';
        
        // Add flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease-out;
            z-index: 9999;
        `;
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.opacity = '0.3';
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => {
                    flash.remove();
                    
                    // Hide current screen
                    currentScreen.classList.remove('active');
                    currentScreen.style.display = 'none';
                    
                    const targetScreen = document.getElementById(screenId);
                    if (targetScreen && targetScreen instanceof HTMLElement) {
                        debug(`Found and activating screen: ${screenId}`);
                        targetScreen.style.display = 'flex';
                        targetScreen.classList.add('active');
                        targetScreen.style.opacity = '1';
                        targetScreen.style.transform = 'scale(1)';
                        gameState.currentScreen = screenId;

                        // Reset animations for intro scene
                        if (screenId === 'intro-scene') {
                            resetIntroAnimations();
                        }

                        // Reset dice position when entering oracle-bones screen
                        if (screenId === 'oracle-bones') {
                            const dice = document.querySelector('.dice');
                            if (dice) {
                                dice.style.transform = 'rotateX(0) rotateY(0) rotateZ(0)';
                                gameState.canRoll = true;
                            }
                        }

                        // Update gold display if entering shop or coin flip
                        if (screenId === 'shop' || screenId === 'coin-flip') {
                            debug(`Updating gold display for ${screenId}. Current gold: ${gameState.gold}`);
                            updateGoldDisplay();
                            if (screenId === 'shop') {
                                debug(`Initializing shop screen... Gold: ${gameState.gold}`);
                                updateShopButtons();
                            }
                        }
                    } else {
                        console.error(`Screen with id "${screenId}" not found in the DOM`);
                    }
                }, 300);
            }, 50);
        }, 100);
    } else {
        debug('No active screen found');
    }
}

// Reset intro scene animations
function resetIntroAnimations() {
    const introScene = document.getElementById('intro-scene');
    const typingSound = new Audio('/typing.mp3');
    typingSound.volume = 0.3;

    function playTypingSound(message) {
        const text = message.querySelector('p').textContent;
        const duration = text.length * 50; // 50ms per character
        
        let startTime = null;
        let soundInterval = null;
        
        function startTypingSound(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            
            if (progress < duration) {
                if (!soundInterval) {
                    soundInterval = setInterval(() => {
                        typingSound.currentTime = 0;
                        typingSound.play().catch(() => {});
                    }, 100);
                }
                requestAnimationFrame(startTypingSound);
            } else if (soundInterval) {
                clearInterval(soundInterval);
            }
        }
        requestAnimationFrame(startTypingSound);
    }
    if (!introScene) return;

    // Reset narrative text
    const narrativeText = introScene.querySelector('.narrative-text');
    if (narrativeText) {
        narrativeText.style.animation = 'none';
        narrativeText.offsetHeight; // Trigger reflow
        narrativeText.style.animation = 'fadeInDown 1s ease-out forwards 0.5s';
    }

    // Reset god messages
    const godMessages = introScene.querySelectorAll('.god-message');
    godMessages.forEach((message, index) => {
        message.style.animation = 'none';
        message.offsetHeight; // Trigger reflow
        if (message.classList.contains('right')) {
            message.style.animation = `slideInRight 1s ease-out forwards ${1.5 + index * 2}s`; 
        } else {
            message.style.animation = `slideIn 1s ease-out forwards ${1.5 + index * 2}s`;
        }
        setTimeout(() => playTypingSound(message), (1.5 + index * 2) * 1000);
    });

    // Reset oracle message
    const oracleMessage = introScene.querySelector('.oracle-message');
    if (oracleMessage) {
        oracleMessage.style.animation = 'none';
        oracleMessage.offsetHeight; // Trigger reflow
        oracleMessage.style.animation = 'fadeInUp 1s ease-out forwards 12s';
    }

    // Reset continue button
    const continueButton = introScene.querySelector('.continue-button');
    if (continueButton) {
        continueButton.style.animation = 'none';
        continueButton.offsetHeight; // Trigger reflow
        continueButton.style.animation = 'fadeInUp 1s ease-out forwards 13s';
    }
}

    // Shop functionality
    function buyItem(itemType, cost) {
        if (gameState.gold >= cost && !gameState.inventory.has(itemType)) {
            gameState.gold -= cost;
            gameState.inventory.add(itemType);
            gameState.powerups[itemType] = 1;
            updateGoldDisplay();
            updateShopButtons();
            
            // Play purchase sound
            const purchaseSound = new Audio('/click.mp3');
            purchaseSound.volume = 0.5;
            purchaseSound.play().catch(() => {});
        }
    }

    function updateShopButtons() {
        const buyButtons = document.querySelectorAll('.buy-button');
        buyButtons.forEach(button => {
            const itemType = button.getAttribute('onclick').match(/'([^']+)'/)[1];
            const cost = parseInt(button.getAttribute('onclick').match(/\d+/)[0]);
            button.disabled = gameState.gold < cost || gameState.inventory.has(itemType);
            button.textContent = gameState.inventory.has(itemType) ? 'Owned' : 'Buy';
        });
    }

// Initialize click handlers
function initializeEventListeners() {
    debug('Initializing event listeners');
    
    // Cast the Bones button click handler
    const continueButton = document.querySelector('.continue-button');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            debug('Cast the Bones button clicked');
            continueButton.classList.remove('active');
            showScreen('oracle-bones');
        });
    }

    // Make functions available globally
    window.showScreen = showScreen;
    window.rollDice = rollDice;
    window.flipCoin = flipCoin;
    // Settings button click handler
    const settingsButton = document.querySelector('.settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            debug('Settings button clicked');
            const settingsModal = document.createElement('div');
            settingsModal.className = 'modal settings-modal';
            settingsModal.innerHTML = `
                <div class="modal-content">
                    <h2>Settings</h2>
                    <div class="settings-options">
                        <div class="setting-item">
                            <label>Music Volume</label>
                            <input type="range" min="0" max="100" value="50">
                        </div>
                        <div class="setting-item">
                            <label>Sound Effects</label>
                            <input type="range" min="0" max="100" value="50">
                        </div>
                    </div>
                    <button class="close-modal">Close</button>
                </div>
            `;
            document.body.appendChild(settingsModal);

            // Add close functionality
            const closeButton = settingsModal.querySelector('.close-modal');
            closeButton.addEventListener('click', () => {
                settingsModal.style.opacity = '0';
                setTimeout(() => settingsModal.remove(), 300);
            });
        });
    }

    // Help button click handler
    const helpButton = document.querySelector('.help-button');
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            debug('Help button clicked');
            const helpModal = document.createElement('div');
            helpModal.className = 'modal help-modal';
            helpModal.innerHTML = `
                <div class="modal-content">
                    <h2>How to Play</h2>
                    <div class="help-content">
                        <p>Welcome to Odyssey Finance! Embark on an epic journey where you'll:</p>
                        <ul>
                            <li>Cast the Oracle's bones to determine your starting fortune</li>
                            <li>Test your luck with coin flips to multiply your gold</li>
                            <li>Purchase powerful items from the Merchant's Shop</li>
                            <li>Face challenging encounters that test your trading wisdom</li>
                        </ul>
                    </div>
                    <button class="close-modal">Close</button>
                </div>
            `;
            document.body.appendChild(helpModal);

            // Add close functionality
            const closeButton = helpModal.querySelector('.close-modal');
            closeButton.addEventListener('click', () => {
                helpModal.style.opacity = '0';
                setTimeout(() => helpModal.remove(), 300);
            });
        });
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    debug('DOM Content Loaded - Initializing game');
    initializeEventListeners();
    initializeAudio();
    // Enable the Cast the Bones button after animations
    const enableButton = () => {
        const continueButton = document.querySelector('.continue-button');
        if (continueButton) {
            continueButton.classList.add('active');
            continueButton.style.pointerEvents = 'auto';
        }
    };
    setTimeout(enableButton, 21000); // Match the CSS animation timing
});

// Handle back button
window.addEventListener('popstate', () => {
    debug('Back button pressed');
    showScreen('welcome-screen');
});

// Prevent closing the WebApp when clicking on external links
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && !link.classList.contains('start-button')) {
        e.preventDefault();
        window.open(link.href, '_blank');
    }
});

// Add touch event handling for mobile
document.addEventListener('touchstart', (e) => {
    debug(`Touch event detected at: ${e.touches[0].clientX}, ${e.touches[0].clientY}`);
});

// Export game state for debugging
window.gameState = gameState;
window.debug = debug;
window.startGameWithMusic = startGameWithMusic;
window.buyItem = buyItem;
window.updateShopButtons = updateShopButtons;

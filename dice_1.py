"""
🎲 DICE CONTROL - WEBSITE LOGIC

This script now includes the same gameplay logic as the website:
- Choice + prediction dice play
- Coins, streaks, win rate, and history
- Leaderboard and stats
- Admin forced outcome control for Telegram users
- Telegram roll mode uses the same forced-outcome behavior
"""

import asyncio
import json
import os
import random
import time
from datetime import datetime

from telethon import TelegramClient, errors
from telethon.tl.types import InputMediaDice

STORE_FILE = 'dice_1_store.json'
DEFAULT_STATS = {
    'totalGames': 0,
    'wins': 0,
    'losses': 0,
    'coins': 0,
    'currentStreak': 0,
    'bestStreak': 0,
    'winRate': 0,
}

# ============================================
# EDIT THESE 5 LINES ONLY
# ============================================

API_ID = 38392950                    # Get from my.telegram.org
API_HASH = '23223fe5b1055113e822e94c811e78e0'  # Get from my.telegram.org
PHONE = '+918101213918'              # Your phone with country code
GROUP_LINK = 'https://t.me/+TlZAt5iI_n01NTM1'  # Your group link

# ============================================
# DON'T EDIT BELOW THIS LINE
# ============================================


def load_store():
    if os.path.exists(STORE_FILE):
        try:
            with open(STORE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    store = {'users': {}, 'games': []}
    save_store(store)
    return store


def save_store(store):
    with open(STORE_FILE, 'w', encoding='utf-8') as f:
        json.dump(store, f, indent=2, ensure_ascii=False)


def normalize_user_key(name):
    return name.strip().lower().replace(' ', '_') if name else 'player'


def get_user(store, key):
    return store['users'].get(key)


def create_user(store, key, username=None, telegram_id=None):
    username = username or key
    user = {
        'username': username,
        'telegramId': telegram_id,
        'stats': DEFAULT_STATS.copy(),
        'forcedOutcome': None,
        'createdAt': datetime.utcnow().isoformat(),
    }
    store['users'][key] = user
    return user


def find_user_by_telegram(store, telegram_id):
    if not telegram_id:
        return None, None
    for key, user in store['users'].items():
        if str(user.get('telegramId')) == str(telegram_id):
            return key, user
    return None, None


def update_stats(user, is_win, coins_earned):
    stats = user.setdefault('stats', DEFAULT_STATS.copy())
    wins = stats.get('wins', 0) + (1 if is_win else 0)
    total = stats.get('totalGames', 0) + 1
    losses = stats.get('losses', 0) + (0 if is_win else 1)
    current_streak = (stats.get('currentStreak', 0) + 1) if is_win else 0
    best_streak = max(stats.get('bestStreak', 0), current_streak)
    coins = stats.get('coins', 0) + coins_earned

    stats.update({
        'totalGames': total,
        'wins': wins,
        'losses': losses,
        'coins': coins,
        'currentStreak': current_streak,
        'bestStreak': best_streak,
        'winRate': round((wins / total) * 100) if total else 0,
    })


def add_game_record(store, user_key, username, choice, prediction, result, is_win, is_prediction_correct, coins_earned, platform):
    record = {
        'id': len(store['games']) + 1,
        'userKey': user_key,
        'username': username,
        'choice': choice,
        'prediction': prediction,
        'result': result,
        'isWin': is_win,
        'isPredictionCorrect': is_prediction_correct,
        'coinsEarned': coins_earned,
        'platform': platform,
        'createdAt': datetime.utcnow().isoformat(),
    }
    store['games'].insert(0, record)
    if len(store['games']) > 100:
        store['games'] = store['games'][:100]


def print_stats(user):
    stats = user.get('stats', DEFAULT_STATS)
    print(f"\n🔹 Stats for {user['username']}")
    print(f"  Games: {stats['totalGames']}")
    print(f"  Wins: {stats['wins']}")
    print(f"  Losses: {stats['losses']}")
    print(f"  Coins: {stats['coins']}")
    print(f"  Current Streak: {stats['currentStreak']}")
    print(f"  Best Streak: {stats['bestStreak']}")
    print(f"  Win Rate: {stats['winRate']}%\n")


def choose_number(prompt):
    while True:
        value = input(prompt).strip()
        if value.isdigit() and 1 <= int(value) <= 6:
            return int(value)
        print('Please enter a number between 1 and 6.')


def choose_username(store):
    username = input('Enter player name: ').strip() or 'Player'
    key = normalize_user_key(username)
    user = get_user(store, key)
    if not user:
        user = create_user(store, key, username=username)
        save_store(store)
    return key, user


def play_website_game(store):
    print('\n=== Website Dice Game ===')
    key, user = choose_username(store)
    choice = choose_number('Choose your number (1-6): ')
    prediction = choose_number('Predict the number (1-6): ')

    forced = user.get('forcedOutcome')
    if forced and 1 <= forced <= 6:
        result = forced
        user['forcedOutcome'] = None
        print(f'🎯 Forced outcome applied: {result}')
    else:
        result = random.randint(1, 6)

    is_win = choice == result
    is_prediction_correct = prediction == result
    coins = 0
    if is_win:
        coins += 10
    if is_prediction_correct:
        coins += 5

    update_stats(user, is_win, coins)
    add_game_record(store, key, user['username'], choice, prediction, result, is_win, is_prediction_correct, coins, 'website')
    save_store(store)

    dice_face = ['','⚀','⚁','⚂','⚃','⚄','⚅'][result]
    print(f'\n🎲 Result: {dice_face} ({result})')
    print('✅ Win!' if is_win else '❌ Loss')
    print('🎯 Prediction correct!' if is_prediction_correct else 'Prediction missed')
    print(f'💰 Coins earned: {coins}')
    print_stats(user)


def set_forced_outcome(store):
    print('\n=== Set Forced Outcome ===')
    telegram_id = input('Enter Telegram user ID: ').strip()
    if not telegram_id.isdigit():
        print('Invalid Telegram ID.')
        return
    outcome = choose_number('Choose forced outcome (1-6): ')
    key, user = find_user_by_telegram(store, telegram_id)
    if not user:
        key = f'tg_{telegram_id}'
        user = create_user(store, key, username=f'TG_{telegram_id}', telegram_id=telegram_id)
    user['telegramId'] = telegram_id
    user['forcedOutcome'] = outcome
    save_store(store)
    print(f'✅ Forced outcome for Telegram {telegram_id} set to {outcome}.')


def show_leaderboard(store):
    print('\n=== Leaderboard ===')
    users = [u for u in store['users'].values() if u.get('stats')]
    users.sort(key=lambda u: u['stats'].get('wins', 0), reverse=True)
    if not users:
        print('No players yet.')
        return
    for i, user in enumerate(users[:10], start=1):
        stats = user['stats']
        print(f"{i}. {user['username']} — {stats['wins']} wins, {stats['coins']} coins, {stats['winRate']}% win rate")


def show_history(store):
    print('\n=== Recent Games ===')
    if not store['games']:
        print('No games yet.')
        return
    for game in store['games'][:10]:
        status = 'Win' if game['isWin'] else 'Loss'
        pred = '✓' if game['isPredictionCorrect'] else '✗'
        print(f"[{game['platform']}] {game['username']} rolled {game['result']} - Choice {game['choice']} - Prediction {game['prediction']} {pred} - {status} +{game['coinsEarned']} coins")


def show_user_stats(store):
    print('\n=== Player Stats ===')
    key, user = choose_username(store)
    print_stats(user)
    history = [g for g in store['games'] if g['userKey'] == key]
    if history:
        print('Recent games:')
        for game in history[:5]:
            status = 'Win' if game['isWin'] else 'Loss'
            print(f"  {game['createdAt'][:19]} — {game['result']} ({status}) +{game['coinsEarned']} coins")


def show_forced_outcomes(store):
    print('\n=== Pending Forced Outcomes ===')
    found = False
    for user in store['users'].values():
        if user.get('forcedOutcome') and user.get('telegramId'):
            found = True
            print(f"Telegram {user['telegramId']} -> {user['forcedOutcome']}")
    if not found:
        print('No pending forced outcomes.')


async def run_telegram_mode(store):
    print('\n=== Telegram Dice Mode ===')
    api_id = input(f'API ID [{API_ID}]: ').strip() or str(API_ID)
    api_hash = input(f'API HASH [{API_HASH}]: ').strip() or API_HASH
    phone = input(f'Phone [{PHONE}]: ').strip() or PHONE
    group_link = input(f'Group link [{GROUP_LINK}]: ').strip() or GROUP_LINK

    if not api_id.isdigit():
        print('API ID must be numeric.')
        return
    client = TelegramClient('dice_session', int(api_id), api_hash)

    try:
        await client.start(phone)
        print('✅ Connected to Telegram')
        chat = await client.get_entity(group_link)

        telegram_id = input('Enter your Telegram ID for stats (optional): ').strip()
        key, user = (find_user_by_telegram(store, telegram_id) if telegram_id else (None, None))
        if not user and telegram_id and telegram_id.isdigit():
            key = f'tg_{telegram_id}'
            user = create_user(store, key, username=f'TG_{telegram_id}', telegram_id=telegram_id)

        if user and user.get('forcedOutcome'):
            target = user['forcedOutcome']
            print(f'🎯 Forced outcome {target} detected. Rolling until it appears...')
            found = False
            for attempt in range(1, 21):
                msg = await client.send_message(chat, file=InputMediaDice('🎲'))
                result = msg.media.value
                if result == target:
                    print(f'✅ Forced result reached after {attempt} attempt(s): {result}')
                    found = True
                    break
                try:
                    await client.delete_messages(chat, [msg.id])
                except Exception:
                    pass
                await asyncio.sleep(0.2)
            if not found:
                print('⚠️ Could not force the outcome within 20 tries. Leaving last roll visible.')
            user['forcedOutcome'] = None
        else:
            msg = await client.send_message(chat, file=InputMediaDice('🎲'))
            result = msg.media.value
            print(f'🎲 Telegram roll result: {result}')

        if user:
            is_win = result >= 4
            coins = 10 if is_win else 0
            update_stats(user, is_win, coins)
            add_game_record(store, key, user['username'], None, None, result, is_win, False, coins, 'telegram')
            save_store(store)
            print('✅ Local Telegram stats updated.')
    except Exception as err:
        print('❌ Telegram error:', err)
    finally:
        await client.disconnect()


def main():
    store = load_store()
    while True:
        print('\n==== Dice Control Menu ====')
        print('1) Play website-style dice game')
        print('2) Set forced outcome for Telegram user')
        print('3) View player stats')
        print('4) View leaderboard')
        print('5) View recent history')
        print('6) View pending forced outcomes')
        print('7) Run Telegram dice mode')
        print('0) Exit')
        choice = input('Select an option: ').strip()

        if choice == '1':
            play_website_game(store)
        elif choice == '2':
            set_forced_outcome(store)
        elif choice == '3':
            show_user_stats(store)
        elif choice == '4':
            show_leaderboard(store)
        elif choice == '5':
            show_history(store)
        elif choice == '6':
            show_forced_outcomes(store)
        elif choice == '7':
            asyncio.run(run_telegram_mode(store))
        elif choice == '0':
            print('Goodbye!')
            break
        else:
            print('Invalid option, please try again.')


if __name__ == '__main__':
    main()

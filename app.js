const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// In-memory storage for user data (replace with database for production)
const users = {};
const range = 64
app.use(express.json()); // Enable parsing JSON request bodies
app.use(cors())
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}
app.get('/start', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    if (!users[userId]) {
        users[userId] = {
            totalBalance: 0,
            currentBallon: {
                index: 0,
                balance: 0,
                pumpCount: 0,
                isExploded: false,
                isRedeem: false,
                explodeArray: Array.from({ length: range }, (_, i) => i + 1)
            },
        };
    } else {
        // Reset game for existing user
        users[userId].totalBalance = 0;
        users[userId].currentBallon = {
            index: 0,
            balance: 0,
            pumpCount: 0,
            isExploded: false,
            isRedeem: false,
            explodeArray: Array.from({ length: range }, (_, i) => i + 1)
        };
    }

    res.json({ success: true });
});

app.get('/pump', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const user = users[userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { ballonIndex, balanceOnThisBallon, isExploded, totalBalance, pumpCount, explodeArray, isRedeem } = user.currentBallon;

    if (isExploded || isRedeem) {
        return res.json({
            userId,
            ballonIndex,
            balanceOnThisBallon,
            isExploded,
            isRedeem,
            totalBalance,
            pumpCount,
            shouldGoNext: true
        });
    }

    shuffle(explodeArray)
    console.log(explodeArray)
    const isExplode = explodeArray.pop() == 1

    if (isExplode) {
        user.currentBallon.isExploded = true;
        user.currentBallon.balance = 0; // Reset balance on explosion
    } else {
        user.currentBallon.balance += 0.05; // Earn 0.5 cents
        user.currentBallon.pumpCount++;
        user.currentBallon.explodeArray = shuffle(explodeArray)
    }

    res.json({
        userId,
        ballonIndex,
        balanceOnThisBallon: user.currentBallon.balance,
        isExplode: user.currentBallon.isExploded,
        isFinite: user.currentBallon.isRedeem,
        totalBalance: user.totalBalance,
        pumpCount: user.currentBallon.pumpCount,
    });
});

app.get('/redeem', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const user = users[userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { ballonIndex, balanceOnThisBallon, isExploded, totalBalance, pumpCount, isRedeem } = user.currentBallon;

    if (isExploded || isRedeem) {
        return res.json({
            userId,
            ballonIndex,
            balanceOnThisBallon,
            isExploded,
            isRedeem,
            totalBalance,
            pumpCount,
            shouldGoNext: true
        });
    }

    user.totalBalance += user.currentBallon.balance;
    user.currentBallon.balance = 0; // Reset balance after redeem
    user.currentBallon.isRedeem = true

    res.json({
        userId,
        ballonIndex,
        balanceOnThisBallon,
        isExploded,
        isRedeem,
        totalBalance: user.totalBalance,
        pumpCount,
        shouldGoNext: true
    });
});

app.get('/next', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const user = users[userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    console.log(user)
    if (!user.currentBallon.isExploded && !user.currentBallon.isRedeem) {
        res.json({ status: "you should either keep pumping or redeem" });
    }

    user.currentBallon.index++;

    if (user.currentBallon.index >= 10) {
        res.json({ finish: true });
    } else {
        user.currentBallon = {
            index: user.currentBallon.index,
            balance: 0,
            pumpCount: 0,
            isExploded: false,
            explodeArray: Array.from({ length: range }, (_, i) => i + 1)
        };
        res.json({ success: true });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

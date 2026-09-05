const express = require('express');

// User Microservice (Port 4001)
const userService = express();
userService.use(express.json());

userService.get('/users/profile', (req, res) => {
    res.json({
        service: 'User Microservice',
        port: 4001,
        profile: {
            id: 'usr_8829',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            accountStatus: 'Active'
        }
    });
});

userService.listen(4001, () => {
    console.log('[User Microservice]: Running on http://localhost:4001');
});

// Order Microservice (Port 4002)
const orderService = express();
orderService.use(express.json());

orderService.get('/orders/list', (req, res) => {
    res.json({
        service: 'Order Microservice',
        port: 4002,
        orders: [
            { id: 'ord_101', item: 'Cloud Gateway Subscription', amount: 49.99 },
            { id: 'ord_102', item: 'Redis Cluster Node', amount: 120.00 }
        ]
    });
});

orderService.listen(4002, () => {
    console.log('[Order Microservice]: Running on http://localhost:4002');
});
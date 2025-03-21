import express from "express";
import axios from "axios";

const APP = express();
const SERVER_PORT = 9876;
const MAX_CACHE_SIZE = 10;
let numCache = [];
let authToken = null;
let tokenExpiryTime = 0;

const API_ENDPOINTS = {
    p: "http://20.244.56.144/test/primes",
    f: "http://20.244.56.144/test/fibo",
    e: "http://20.244.56.144/test/even",
    r: "http://20.244.56.144/test/rand"
};

const AUTH_ENDPOINT = "http://20.244.56.144/test/auth";
const AUTH_DETAILS = {
    "companyName": "goMart",
    "clientID": "ce6cfcc4-febf-4ba3-9163-5416feecead5",
    "clientSecret": "ykfzmpUnksyKlODG",
    "ownerName": "Arun Baghel",
    "ownerEmail": "arun.2201084cs@iiitbh.ac.in",
    "rollNo": "2201084cs"
};

async function fetchAuthToken() {
    try {
        const response = await axios.post(AUTH_ENDPOINT, AUTH_DETAILS);
        authToken = response.data.access_token;
        tokenExpiryTime = Date.now() + response.data.expires_in * 1000;
        return authToken;
    } catch (error) {
        throw new Error("Failed to Retrieve Token");
    }
}

async function getValidAuthToken() {
    if (!authToken || Date.now() >= tokenExpiryTime) {
        return await fetchAuthToken();
    }
    return authToken;
}

async function retrieveNumbers(category) {
    try {
        const token = await getValidAuthToken();
        const response = await axios.get(API_ENDPOINTS[category], {
            timeout: 500,
            headers: { Authorization: `Bearer ${token}` } 
        });
        return response.data.numbers || [];
    } catch (error) {
        return [];
    }
}

APP.get("/numbers/:category", async (req, res) => {
    const category = req.params.category;
    if (!["p", "f", "r", "e"].includes(category)) {
        return res.status(400).json({ error: "Invalid Category" });
    }

    const previousNumbers = [...numCache];
    const newNumbers = await retrieveNumbers(category);

    newNumbers.forEach(num => {
        if (!numCache.includes(num)) {
            numCache.push(num);
        }
    });

    while (numCache.length > MAX_CACHE_SIZE) {
        numCache.shift();
    }

    const avgValue = numCache.length ? (numCache.reduce((a, b) => a + b, 0) / numCache.length).toFixed(2) : 0;

    res.json({
        previousData: previousNumbers,
        updatedData: numCache,
        fetchedNumbers: newNumbers,
        averageValue: parseFloat(avgValue)
    });
});

APP.listen(SERVER_PORT, () => console.log(`Server running at http://localhost:${SERVER_PORT}`));

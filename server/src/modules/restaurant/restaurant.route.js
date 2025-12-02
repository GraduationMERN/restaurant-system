import express from "express";
import { getRestaurant, updateRestaurant } from "./restaurant.controller.js";
const app = express.Router();

app.get("/", getRestaurant);
app.put("/", updateRestaurant);


export default app;
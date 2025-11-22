import { getAllProductsService, getProductByIdService, createProductService } from '../services/product.service.js';
import { getEmbedding } from "../services/chat.service.js"; // for AI


//getAllProducts
export const getAllProducts = async (req, res) => {
    try {
        const products = await getAllProductsService();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


//getProductById
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getProductByIdService(id);
        if (!product) {
            return res.status(404).json({ message: 'product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


//createProduct
export const createProduct = async (req, res) => {
    try {
        const { name, desc, categoryId, stock, price } = req.body;
        if (!name || !desc || !req.file || !categoryId || !stock || !price) {
            return res.status(400).json({ message: 'Name , desc , image , stock , price and category are required' });
        }
        req.body.imgURL = req.file.path;
        
        // these line for AI 
        const text = `${name}. ${desc}. Tags: ${p.tags?.join(',') || ''}. Price: ${price}`;
        const embeddingProduct = await getEmbedding(text);

        const product = await createProductService({ ...req.body, embedding: embeddingProduct }); // storing embeddings for product for AI search
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
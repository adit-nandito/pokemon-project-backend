-- Create the database
CREATE DATABASE PokemonDB;
USE PokemonDB;

-- Create patients table
CREATE TABLE pokemon (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pokemon VARCHAR(5000) NOT NULL,
    name_pokemon VARCHAR(75) NOT NULL,
    nickname_pokemon VARCHAR(75) NOT NULL
);

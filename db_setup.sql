-- Run these commands in PostgreSQL 15 or higher

-- Create a db named blog
CREATE DATABASE blogdb;

-- Create a table within above database
CREATE TABLE blog(
    id SERIAL PRIMARY KEY NOTNULL,
    title VARCHAR(60) NOTNULL,
    content TEXT NOTNULL,
    author VARCHAR(50) NOTNULL,
    date TIMESTAMPTZ NOTNULL
);




-- Create database (run this outside the DB if needed)
CREATE DATABASE blogdb;
\c blogdb  -- Connect to the database (use in psql or pgAdmin query tool)


-- Create the blog table
CREATE TABLE blog (
    id SERIAL PRIMARY KEY,
    title character varying(60) NOT NULL,
    content text NOT NULL,
    author character varying(50) NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

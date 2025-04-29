import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pg from "pg";
import 'dotenv/config';

const app = express();
const port = 4000;

// Get the credentials for postgresql from .env file
const pg_user = process.env.user;
const pg_host = process.env.host;
const pg_db = process.env.database;
const pg_password = process.env.password;
const pg_port = process.env.port;


// Create a Postgresql client
const db = new pg.Client({
  user: pg_user,
  host: "localhost",
  database: pg_db,
  password: pg_password,
  port: pg_port,
});

// Connect to above client/db
db.connect();

// In-memory data store
let posts = [];

// let lastId = 3;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());


// 1: GET ALL POSTS
// Function with SQL query to Get all posts
async function getPosts(){
  const result = await db.query("SELECT * FROM blog ORDER BY id ASC;");
  var postData = result.rows;
  console.log("Postdata from db is: "+postData);

  // return postData;
  posts = postData;
  // console.log(posts);
  console.log("Count of Posts is: "+posts.length);
}

// Route to GET All posts
app.get("/posts", async (req, res)=>{
  var result = await getPosts();

  // Send the posts as a json to the main server, which in turn will use them for display on the website
  res.json(posts);
});



// 2: GET A SPECIFIC POST BY ID ON A NEW PAGE FOR EDITING
// Function with SQL query to find a specific post
async function findPost(postId) {
  const result = await db.query("SELECT * FROM blog WHERE id=$1", [postId]);

  var foundPost = result.rows[0];
  console.log("The found post is: "+foundPost);

  console.log("The found post's id is: "+foundPost.id);
  console.log("The found post's title is: "+foundPost.title);

  // Update the posts list by calling getPosts
  const checkPosts = await getPosts();

  return foundPost;
}

// GET a specific post by id
app.get("/posts/:id", async (req,res)=>{
  // Extract data received from params
  const target_id = parseInt(req.params.id);

  console.log("The specific post id is: "+target_id); 
  
  // Find the required post based on id from the db
  var specificPost = await findPost(target_id);
  console.log("The selected post for editing is: ");
  console.log(specificPost);


  // Send back the specific required post as the response
  res.json(specificPost);

});



// 3: CREATE A NEW POST
// Function with SQL query to Create a post
async function createPost(title, content, author) {
  
    const newPost = await db.query("INSERT INTO blog(title, content, author) VALUES($1, $2, $3) RETURNING *",
      [title, content, author]);

    
    var newPostResponse = newPost.rows;
    console.log("Newly added Post in DB is: "+newPostResponse);

  // Update the posts list by calling getPosts
  const checkPosts = await getPosts();
}

// Route to create a new post
app.post("/posts",async (req, res)=>{
  // Extract the required details from the form
  var newTitle = req.body.title;
  var newContent = req.body.content;
  var newAuthor = req.body.author;

  // Take the above data and add into database by calling db query function
  const result = await createPost(newTitle, newContent, newAuthor);

  // Send back the updated posts list as a repsonse that includes the newly added post
  res.json(posts);
});



// 4: PATCH/UPDATE A POST 
// Function to Edit a Blog Post
async function editPost(postId, newTitle, newContent, newAuthor, newDate) {
  // Find the old info about the post we are editing, no need to extract again using .rows, 
  // it returns the extract json of the post directly
  const existingPost = await findPost(postId);


  console.log("Old Data for post from db is: ")
  console.log(existingPost)


  // Extract and store the old info to be compared with newer info
  var oldTitle = existingPost.title;
  var oldContent = existingPost.content;
  var oldAuthor = existingPost.author;
  // var oldDate = oldData.date

  // Compare new & old info and change if its actually new
  var changedTitle = newTitle || oldTitle;
  var changedContent = newContent || oldContent;
  var changedAuthor = newAuthor || oldAuthor;
  var changedDate = newDate;

  // Update the new changes into the database
  const changes = await db.query("UPDATE blog SET title=$1, content=$2, author=$3, date=$4 WHERE id=$5 RETURNING *",
    [changedTitle, changedContent, changedAuthor, changedDate, postId]);


  console.log("Changed Row is: "+changes.rows[0]);

  // Update the changes into the db and send back all the posts to render again
  const result = await getPosts();

}

// Route to patch/update a post when you just want to update one/multiple parameters
app.patch("/posts/:id", async (req, res)=>{
  // Get the target id and use it to locate the post to be edite
  const target_id = parseInt(req.params.id);

  // Get the changed stuff like below parameters
  var newTitle = req.body.title;
  var newContent = req.body.content;
  var newAuthor = req.body.author;
  const date = new Date();


  // Call the method to edit post and pass new info entered by user
  const edits = await editPost(target_id, newTitle, newContent, newAuthor, date);

  console.log("Post has been changed(PATCH)");

  // console.log(posts);

  // Send back the updated posts list as a repsonse that includes the newly added post
  res.json(posts);
});



// 5: DELETE A SPECIFIC POST BY PROVIDING THE POST'S ID
// Function with SQL query to Delete a post
async function deletePost(postId) {
  // Delete the post from db based on the id
    const result = await db.query("DELETE FROM blog WHERE id=$1",[postId]);

    // Update the posts list
    const checkPosts = await getPosts();
    console.log(posts);
}

// Route to DELETE a specific post by providing the post id.
app.delete("/posts/:id",async (req, res)=>{
  // Get the post id which will be used to find and delete the post
  const target_id = parseInt(req.params.id);
  console.log("The post to be deleted has id of: "+target_id);


  try {
    console.log("Posts List length before delete: "+ posts.length);

    const postDeletion = await deletePost(target_id);

    console.log("Post with id " + target_id+" has been deleted(DEL)");
    console.log("Posts List length after delete: "+ posts.length);

    // Return a json as the response 
    // Send back the updated posts list as a repsonse that includes the newly added post
    res.json(posts);

  } catch (error) {
      console.log("Error encountered while deleting post: "+error);
      // If post does not exist send back some json and error code
      res.status(404).json({error: "Post with id "+target_id+" not found, Nothing Deleted"});
    }

});



// 6: DELETE ALL POSTS
// Function to Delete All posts
async function deleteAll(params) {
  const del_result = await db.query("DELETE FROM blog");
  console.log("After running Delete all: "+del_result.rows);

  // Get any posts, ideally will do nothing
  await getPosts();
    
}

// Route to Delete All Posts
app.delete("/delete/all", async (req, res)=>{
  console.log("Trying to Delete All posts!");

  // Delete all posts
  const delAllResult = await deleteAll();

  res.json(posts);
});


// Start the Web app
app.listen(port, () => {
  console.log(`API server is running at http://localhost:${port}`);
});

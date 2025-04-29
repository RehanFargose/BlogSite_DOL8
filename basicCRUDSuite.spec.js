import { Builder, By, Key, until } from 'selenium-webdriver';
import assert from 'assert';
import axios from "axios";

async function waitForServerReady(url, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await axios.get(url);
      return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error("Server did not become ready in time");
}

describe('Basic CRUD Suite', function () {
  this.timeout(60000);
  let driver;

  beforeEach(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    await waitForServerReady('http://localhost:3000');
  });

  afterEach(async function () {
    await driver.quit();
  });

  it('CreatePostTest', async function () {
    await driver.get("http://localhost:3000");
    await driver.findElement(By.id("newPostBtn")).click();
    await driver.findElement(By.name("title")).sendKeys("Devops Exp 4.1");
    await driver.findElement(By.name("content")).sendKeys("This is basic testing of new post route on server");
    await driver.findElement(By.name("author")).sendKeys("Rehan Fargose");
    await driver.findElement(By.css(".full-width")).click();
    await driver.sleep(1500);

    const postTitle = await driver.findElement(By.xpath("//ul/li/h2[contains(text(), 'Devops Exp 4.1')]")).getText();
    assert.strictEqual(postTitle, "Devops Exp 4.1");

    await driver.findElement(By.xpath("//h2[contains(text(), 'Devops Exp 4.1')]/../a[@class='delete']")).click();
  });

  it('DeletePostTest', async function () {
    await driver.get("http://localhost:3000");
    await driver.findElement(By.id("newPostBtn")).click();
    await driver.findElement(By.name("title")).sendKeys("Devops Exp 4.2");
    await driver.findElement(By.name("content")).sendKeys("This is basic testing of new post route on server");
    await driver.findElement(By.name("author")).sendKeys("Rehan Fargose");
    await driver.findElement(By.css(".full-width")).click();

    // ✅ Wait for the post to be visible
    const post = await driver.wait(
      until.elementLocated(By.xpath("//ul/li/h2[contains(text(), 'Devops Exp 4.2')]")),
      5000
    );
    assert.strictEqual(await post.getText(), "Devops Exp 4.2");

    // ✅ Delete the post
    await driver.findElement(By.xpath("//h2[contains(text(), 'Devops Exp 4.2')]/../a[@class='delete']")).click();

    // ✅ Wait until the element disappears
    await driver.wait(async () => {
      const elements = await driver.findElements(By.xpath("//h2[contains(text(), 'Devops Exp 4.2')]"));
      return elements.length === 0;
    }, 5000);
  });

  it('UpdatePostTest', async function () {
    await driver.get("http://localhost:3000");
    await driver.findElement(By.id("newPostBtn")).click();
    await driver.findElement(By.name("title")).sendKeys("Devops Exp 4.3");
    await driver.findElement(By.name("content")).sendKeys("This is basic testing of new post route on server");
    await driver.findElement(By.name("author")).sendKeys("Rehan Fargose");
    await driver.findElement(By.css(".full-width")).click();
    await driver.sleep(1500);

    await driver.wait(until.elementLocated(By.xpath("//ul[@id='postsList']/li/h2[contains(text(), 'Devops Exp 4.3')]")), 5000);
    await driver.sleep(1000);

    await driver.findElement(By.xpath("//ul[@id='postsList']/li[h2[contains(text(), 'Devops Exp 4.3')]]/a[@class='edit']")).click();

    const titleInput = await driver.findElement(By.name("title"));
    await titleInput.clear();
    await titleInput.sendKeys("Devops Exp 4.3 updated");

    const contentInput = await driver.findElement(By.name("content"));
    await contentInput.clear();
    await contentInput.sendKeys("Updating this post");

    const authorInput = await driver.findElement(By.name("author"));
    await authorInput.clear();
    await authorInput.sendKeys("Rehan Fargose2");

    await driver.findElement(By.css(".full-width")).click();
    await driver.sleep(1500);

    const updatedTitle = await driver.findElement(By.xpath("//ul/li/h2[contains(text(), 'Devops Exp 4.3 updated')]")).getText();
    assert.strictEqual(updatedTitle, "Devops Exp 4.3 updated");

    await driver.findElement(By.xpath("//h2[contains(text(), 'Devops Exp 4.3 updated')]/../a[@class='delete']")).click();
  });

  it('DeleteAllTest', async function () {
    await driver.get("http://localhost:3000");
  
    try {
      // Log the current page title to ensure we're on the right page
      const title = await driver.getTitle();
      console.log("Page title:", title);
  
      // ✅ Wait until either postsList or "no posts" message is found
      const postsListExists = await driver.wait(async () => {
        const postList = await driver.findElements(By.css('#postsList'));
        const noPostsMsg = await driver.findElements(By.css('.no-posts'));
        return postList.length > 0 || noPostsMsg.length > 0;
      }, 7000);
  
      // 🧹 Delete All only if posts are present
      const postItems = await driver.findElements(By.css('#postsList li'));
      if (postItems.length > 0) {
        const deleteAllBtn = await driver.findElement(By.xpath("//div[@class='actions']/a[contains(text(), 'Delete All')]"));
        await deleteAllBtn.click();
  
        // Wait until posts list is cleared
        await driver.wait(async () => {
          const remaining = await driver.findElements(By.css('#postsList li'));
          return remaining.length === 0;
        }, 5000);
      }
  
      // ✅ Confirm no-posts message appears
      const msg = await driver.findElement(By.css(".no-posts p")).getText();
      assert.strictEqual(msg, "No posts available. Start by creating a new one!");
    } catch (error) {
      console.error("Error in DeleteAllTest:", error);
      throw error;
    }
  });


});



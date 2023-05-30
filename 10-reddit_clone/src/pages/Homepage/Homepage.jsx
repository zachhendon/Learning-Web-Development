import { Link } from "react-router-dom";
import styles from "./Homepage.module.css";
import { useDispatch, useSelector } from "react-redux";
import { searchPosts } from "../../features/posts/postsSlice";
import { useState, useEffect } from "react";
import Post from "../../app/common/components/Post";

export default function Homepage() {
  const [value, setValue] = useState(useSelector((state) => state.posts.query));
  const [limit, setLimit] = useState(useSelector((state) => state.posts.limit));
  const [displayPosts, setDisplayPosts] = useState("");
  const posts = useSelector((state) => state.posts.posts);
  const status = useSelector((state) => state.posts.status);
  const stateLimit = useSelector((state) => state.posts.limit);
  const stateSort = useSelector((state) => state.posts.sort);
  const dispatch = useDispatch();

  const handleClick = (e) => {
    e.preventDefault();
    if (value !== "") {
      dispatch(searchPosts({ query: value, limit, sort: "hot" }));
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleNumberInput = (e) => {
    setLimit(e.target.value);
  };

  const handleMore = () => {
    dispatch(
      searchPosts({
        query: value,
        limit: stateLimit + 5,
        sort: stateSort,
      })
    );
  };

  useEffect(() => {
    switch (status) {
      case "loading":
        setDisplayPosts((prevDisplayPosts) => {
          <>
            {prevDisplayPosts}
            <p>Loading...</p>
          </>;
        });
        break;
      case "succeeded":
        setDisplayPosts(
          <>
            {posts.map((post, index) => (
              <Post post={post} key={index} />
            ))}
          </>
        );
        break;
      case "failed":
        setDisplayPosts(
          <>
            <p style={{ color: "red" }}>Failed to load new posts</p>
            <div>
              {posts.map((post, index) => (
                <Post post={post} key={index} />
              ))}
            </div>
          </>
        );
        break;
      default:
        setDisplayPosts(<p>Search for posts</p>);
        break;
    }
  }, [status, posts, dispatch, stateLimit, stateSort, value]);

  return (
    <>
      <Link to="/post/1" style={{ textDecoration: "none" }}>
        <h1 className={styles.test}>Homepage</h1>
      </Link>

      <main>
        <button onClick={handleClick}>Search</button>
        <form onSubmit={handleClick}>
          <label>Search</label>
          <input
            type="text"
            value={value}
            placeholder="search"
            onInput={handleInput}
          />
        </form>
        <form onSubmit={handleClick}>
          <label>Limit</label>
          <input
            type="number"
            value={limit}
            placeholder="limit"
            onInput={handleNumberInput}
          ></input>
        </form>
        {displayPosts}
        <button onClick={handleMore}>See more...</button>
      </main>
    </>
  );
}

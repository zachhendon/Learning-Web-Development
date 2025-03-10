import { useDispatch, useSelector } from "react-redux";
import { searchPosts } from "../../features/posts/postsSlice";
import { useState, useEffect, useCallback } from "react";
import Post from "../../app/common/components/Post/Post";
import NavBar from "./components/NavBar/NavBar";

export default function Homepage() {
  const [value, setValue] = useState(useSelector((state) => state.posts.query));
  const searchMessage = "Search for posts";
  const [displayPosts, setDisplayPosts] = useState(<p>{searchMessage}</p>);
  const posts = useSelector((state) => state.posts.posts);
  const sort = useSelector((state) => state.posts.sort);
  const status = useSelector((state) => state.posts.status);
  const limit = useSelector((state) => state.posts.limit);
  const stateSort = useSelector((state) => state.posts.sort);
  const dispatch = useDispatch();

  const submitQuery = () => {
    if (value !== "") {
      dispatch(searchPosts({ query: value, limit, sort }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitQuery();
  };

  const handleMore = useCallback(() => {
    dispatch(
      searchPosts({
        query: value,
        limit: limit + 10,
        sort: stateSort,
      })
    );
  }, [dispatch, limit, stateSort, value]);

  useEffect(() => {
    switch (status) {
      case "loading":
        setDisplayPosts((prev) =>
          posts.length !== 0 ? (
            <>
              {prev}
              <p>Loading more posts...</p>
            </>
          ) : (
            <p>Loading...</p>
          )
        );
        break;
      case "succeeded":
        setDisplayPosts(
          <>
            {posts.map((post, index) => (
              <Post postIndex={index} key={index} handleMore={handleMore} />
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
                <Post postIndex={index} key={index} handleMore={handleMore} />
              ))}
            </div>
          </>
        );
        break;
      default:
        setDisplayPosts(<p>{searchMessage}</p>);
        break;
    }
  }, [status, posts, dispatch, limit, stateSort, value, handleMore]);

  return (
    <>
      <NavBar
        value={value}
        setValue={setValue}
        sort={sort}
        handleSubmit={handleSubmit}
        submitQuery={submitQuery}
      />
      <main>
        {displayPosts}
      </main>
    </>
  );
}

import { useDispatch, useSelector } from "react-redux";
import { searchPosts } from "../../features/posts/postsSlice";
import { useState, useEffect } from "react";
import Post from "../../app/common/components/Post/Post";
import LogoBar from "../../app/common/components/LogoBar/LogoBar";
import SearchBar from "../../app/common/components/SearchBar/SearchBar";

export default function Homepage() {
  const [value, setValue] = useState(useSelector((state) => state.posts.query));
  const [limit, setLimit] = useState(useSelector((state) => state.posts.limit));
  const searchMessage = "Search for posts";
  const [displayPosts, setDisplayPosts] = useState(<p>{searchMessage}</p>);
  const [searched, setSearched] = useState(false);
  const posts = useSelector((state) => state.posts.posts);
  const status = useSelector((state) => state.posts.status);
  const stateLimit = useSelector((state) => state.posts.limit);
  const stateSort = useSelector((state) => state.posts.sort);
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value !== "") {
      dispatch(searchPosts({ query: value, limit, sort: "hot" }));
    }
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
    setSearched(
      typeof displayPosts.props.children !== "string" &&
        displayPosts.props.children !== searchMessage
    );
  }, [displayPosts]);

  useEffect(() => {
    switch (status) {
      case "loading":
        setDisplayPosts((prev) =>
          searched ? (
            <>
              {prev}
              <p>Loading...</p>
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
              <Post postIndex={index} key={index} />
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
                <Post postIndex={index} key={index} />
              ))}
            </div>
          </>
        );
        break;
      default:
        setDisplayPosts(<p>{searchMessage}</p>);
        break;
    }
  }, [status, posts, dispatch, stateLimit, stateSort, value, searched]);

  return (
    <>
      <header>
        <LogoBar />
      </header>
      <main>
        <SearchBar
          value={value}
          setValue={setValue}
          handleSubmit={handleSubmit}
        />
        {displayPosts}
        {searched && <button onClick={handleMore}>See more...</button>}
      </main>
    </>
  );
}

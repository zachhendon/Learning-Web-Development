import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import styles from "./Post.module.css";
import PostUps from "../PostUps/PostUps";
import Comment from "../Comment/Comment";

function Post(props) {
  const posts = useSelector((state) => state.posts.posts);
  const limit = useSelector((state) => state.posts.limit);

  const myRef = useRef();
  useEffect(() => {
    if (posts.length <= props.postIndex) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && props.postIndex === limit - 2) {
        props.handleMore();
      }
    });
    observer.observe(myRef.current);
  }, [limit, posts.length, props]);

  const error = (
    <>
      <h5 className={styles.error}>
        Sorry, there was an error loading this post
      </h5>
    </>
  );

  if (posts.length <= props.postIndex) {
    return <></>;
  }
  const post = posts[props.postIndex];
  const title = post.title;
  const mediaUrl = post.mediaUrl;
  let media;

  if (mediaUrl === null) {
    media = <></>;
  } else {
    if (post.isVideo) {
      media = (
        <video
          style={{ alignSelf: "center", maxWidth: "100%", height: "36rem" }}
          alt="desc"
          controls
        >
          <source src={mediaUrl} type="video/mp4"></source>
        </video>
      );
    } else {
      // image
      media = (
        <img
          src={mediaUrl}
          style={{
            alignSelf: "center",
            maxWidth: "100%",
            height: "36rem",
            objectFit: "cover",
          }}
          alt="desc"
        ></img>
      );
    }
  }
  const subreddit = post.subreddit;
  const ups = <PostUps ups={post.ups} postIndex={props.postIndex} />;

  return (
    <>
      <div ref={myRef} className={"grid " + styles.postComments}>
        <div className={"flex " + styles.postSubreddit}>
          <h5>{"r/" + subreddit}</h5>
          <div className={"flex " + styles.postContent}>
            {ups}
            <div className={"flex " + styles.postTitle}>
              <p>{title}</p>
              {media}
            </div>
          </div>
        </div>
        <Comment postIndex={props.postIndex} />
      </div>
    </>
  );
}

export default Post;

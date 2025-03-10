import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  posts: [],
  status: "idle",
  query: "",
  limit: 10,
  sort: "hot",
  after: "",
  error: "",
};

const formatComments = (comments) => {
  const formattedComments = [];
  for (const comment of comments) {
    const author = comment.data.author;
    const body = comment.data.body;
    const ups = comment.data.ups;
    const replies = comment.data.replies;

    if (author === "[deleted]" || author === undefined) continue;

    formattedComments.push({
      author,
      body,
      ups,
      replies: replies ? formatComments(replies.data.children) : [],
    });
  }
  return formattedComments;
};

const getAllComments = (comments) => {
  const allComments = [];
  for (const comment of comments) {
    allComments.push(comment);
    allComments.push(...getAllComments(comment.replies));
  }
  return allComments;
};

const addUserProfiles = async (comments) => {
  const allComments = getAllComments(comments);

  let response;
  try {
    response = await Promise.all(
      allComments.map((comment) =>
        axios.get(`https://www.reddit.com/user/${comment.author}/about.json`)
      )
    );
  } catch (e) {
    response = [];
  }

  const mediaUrls = response.map((user) => {
    try {
      return user.data.data.icon_img.split("?")[0];
    } catch (e) {
      const version = Math.floor(Math.random() * 8);
      return `https://www.redditstatic.com/avatars/defaults/v2/avatar_default_${version}.png`;
    }
  });

  for (let i = 0; i < allComments.length; i++) {
    allComments[i].userProfile = mediaUrls[i];
  }
};

const getComments = async (posts) => {
  let response;
  try {
    response = await Promise.all(
      posts.map((post) => {
        return axios.get(
          `https://www.reddit.com/r/${post.data.subreddit}/comments/${post.data.id}.json`
        );
      })
    );
  } catch (e) {}

  let commentsList = response.map((comment) => comment.data[1].data.children);
  commentsList = commentsList.map((comments) => formatComments(comments));

  await Promise.all(commentsList.map((comments) => addUserProfiles(comments)));

  return commentsList;
};

const isValidMedia = (url) => {
  return (
    ["jpg", "jpeg", "tiff", "png", "gif", "bmp"].indexOf(url.slice(-3)) !== -1
  );
};
const getPosts = async (query, limit, sort, thunkAPI) => {
  const response = await axios.get("https://www.reddit.com/search.json", {
    params: {
      q: query,
      limit: limit,
      sort: sort,
      after: thunkAPI.getState().posts.after,
    },
  });
  const data = response.data.data;
  const postsData = data.children;
  if (postsData.length === 0) {
    thunkAPI.dispatch("searchPosts/rejected");
  }
  let posts = [];
  const commentsList = await getComments(postsData);
  for (let i = 0; i < postsData.length; i++) {
    const comments = commentsList[i];
    const post = postsData[i].data;
    const id = post.id;
    const title = post.title;
    const subreddit = post.subreddit;
    const ups = post.ups;
    const isVideo = post.is_video;
    let mediaUrl;
    if (isVideo) {
      if (!post.media) {
        mediaUrl = null;
      }
      mediaUrl = post.media.reddit_video.fallback_url;
    } else {
      if (post.url && isValidMedia(post.url)) {
        mediaUrl = post.url;
      } else if (post.thumbnail && isValidMedia(post.thumbnail)) {
        mediaUrl = post.thumbnail;
      } else {
        mediaUrl = null;
      }
    }
    posts.push({
      comments,
      id,
      title,
      subreddit,
      ups,
      isVideo,
      mediaUrl,
    });
  }
  return { posts, after: data.after };
};

export const searchPosts = createAsyncThunk(
  "posts/searchPosts",
  async (params, thunkAPI) => {
    const state = thunkAPI.getState().posts;
    const dispatch = thunkAPI.dispatch;
    const query = params.query || state.query;
    const limit = params.limit || state.limit;
    const limitDiff = limit - state.limit;
    const sort = params.sort || state.sort;

    if (params.query !== state.query || params.sort !== state.sort) {
      // query changed
      dispatch(resetPosts());
      dispatch(setParams({ query, limit, sort }));
      return await getPosts(query, limit, sort, thunkAPI);
    } else if (limitDiff === 0) {
      // same query, same posts
      dispatch(statusSucceeded());
      return;
    } else if (limitDiff > 0) {
      // same query, more posts
      const response = await getPosts(query, limitDiff, sort, thunkAPI);
      dispatch(setParams(params));
      return response;
    } else {
      // same query, less posts
      dispatch(setParams(params));
      dispatch(removePosts(-1 * limitDiff));
      dispatch(statusSucceeded());
    }
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState: initialState,
  reducers: {
    addPosts: (state, action) => {
      let posts = action.payload;
      if (Array.isArray(action.payload)) {
        posts = [action.payload];
      }
      for (const post of posts) {
        state.posts.push(post);
      }
    },
    removePosts: (state, action) => {
      state.posts = state.posts.slice(0, state.posts.length - action.payload);
    },
    setParams: (state, action) => {
      state.query = action.payload.query;
      state.limit = parseInt(action.payload.limit);
      state.sort = action.payload.sort;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    setHeight: (state, action) => {
      const postIndex = action.payload.postIndex;
      const height = action.payload.height;
      state.posts[postIndex].height = height;
    },
    resetPosts: (state) => {
      state.posts = [];
      state.after = "";
    },
    statusSucceeded: (state) => {
      state.status = "succeeded";
    },
    collapseComment: (state, action) => {},
    expandComment: (state, action) => {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchPosts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        if (action.payload === undefined || action.payload === null) {
          return;
        }
        state.status = "succeeded";
        for (const post of action.payload.posts) {
          state.posts.push(post);
        }
        state.after = action.payload.after;
        state.error = "";
      })
      .addCase(searchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const {
  addPosts,
  removePosts,
  setParams,
  setSort,
  setHeight,
  resetPosts,
  statusSucceeded,
  collapseComment,
  expandComment,
} = postsSlice.actions;

export default postsSlice.reducer;

const clientID = "a425727877ce4345b436f89aeef24a3f";
const redirectURI = "http://localhost:3000/";
let accessToken;

export const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    } else {
      const accessTokenMatch =
        window.location.href.match(/access_token=([^&]*)/);
      const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

      if (accessTokenMatch && expiresInMatch) {
        accessToken = accessTokenMatch[1];
        const expires = Number(expiresInMatch[1]);

        window.setTimeout(() => (accessToken = ""), expires * 1000);
        window.history.pushState("Access Token", null, "/");

        return accessToken;
      } else {
        const accessURL =
          `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type` +
          `=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
        window.location = accessURL;
      }
    }
  },

  search(searchValue) {
    const accessToken = Spotify.getAccessToken();

    return fetch(
      `https://api.spotify.com/v1/search?type=track&q=${searchValue}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
      .then((response) => {
        return response.json();
      })
      .then((jsonResponse) => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri,
        }));
      });
  },

  savePlaylist(name, uriList) {
    if (!name || !uriList.length) {
      return;
    }

    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    let userId;

    return fetch("https://api.spotify.com/v1/me", { headers: headers })
      .then((response) => response.json())
      .then((jsonResponse) => {
        userId = jsonResponse.id;

        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
          headers: headers,
          method: "POST",
          body: JSON.stringify({ name: name }),
        })
          .then((response) => response.json())
          .then((jsonResponse) => {
            const playlistId = jsonResponse.id;

            return (
              fetch(
                `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`
              ),
              {
                header: headers,
                method: "POST",
                body: JSON.stringify({ uris: uriList }),
              }
            );
          });
      });
  },
};

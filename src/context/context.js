import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [followers, setFollowers] = useState(mockFollowers);
  const [repos, setRepos] = useState(mockRepos);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });
  const searchGithubUser = async (user) => {
    toggleError(false, "");
    setLoading(true);
    try {
      const GithubUser = await axios.get(`${rootUrl}/users/${user}`);
      setGithubUser(GithubUser.data);
      if (GithubUser) {
        const { login, followers_url } = GithubUser.data;
        try {
          const [repos, followers] = await Promise.allSettled([
            axios.get(`${rootUrl}/users/${login}/repos?per_page=100`),
            axios.get(`${followers_url}?per_page=100`),
          ]);
          if (repos.status === "fulfilled") {
            setRepos(repos.value.data);
          }
          if (repos.status === "fulfilled") {
            setFollowers(followers.value.data);
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        toggleError(true, "There is no user with that username");
      }
    } catch (error) {
      console.log(error);
    }
    checkRequests();
    setLoading(false);
  };
  const checkRequests = async () => {
    try {
      const { data } = await axios.get(`${rootUrl}/rate_limit`);
      let {
        rate: { remaining },
      } = data;
      console.log(remaining);
      setRequests(remaining);
      if (remaining === 0) {
        toggleError(true, "No Requests Remaining");
      }
    } catch (error) {
      console.log(error);
    }
  };
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  useEffect(() => {
    checkRequests();
  }, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        followers,
        repos,
        requests,
        error,
        searchGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };

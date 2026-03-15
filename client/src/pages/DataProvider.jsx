import useFetch from "../hooks/useFetch";
import friendsApi from "../api/modules/friends";
import groups from "../api/modules/groups";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  setFriends,
  setGroups,
  setNotifications,
} from "../store/functions/data";

const DataProvider = ({ children }) => {
  const { isAuthenticated } = useSelector((store) => store.user);

  //fetch friends
  useFetch(friendsApi.getAllFriends, [], setFriends, isAuthenticated);

  //fetch groups
  useFetch(groups.getAllGroups, [], setGroups, isAuthenticated);

  //fetch notis
  useFetch(groups.getAllNotifications, [], setNotifications, isAuthenticated);

  return <>{children}</>;
};

DataProvider.propTypes = {
  children: PropTypes.node,
};

export default DataProvider;

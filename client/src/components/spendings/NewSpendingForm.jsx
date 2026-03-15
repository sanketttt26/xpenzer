import { useRef, useState } from "react";
import { formatDateForInput } from "../../utils/date";
import InputGroup from "./InputGroup";
import SearchBar from "./SearchBar";
import FriendItem from "./FriendItem";
import Contributor from "./Contributor";
import VoiceExpenseAssistant from "./VoiceExpenseAssistant";
import { spendingStyles } from "./styles";
import friendsApi from "../../api/modules/friends";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addContributor,
  savePayload,
  setRefPayload,
  splitAmountEqually,
} from "../../store/functions/spending.payload";

// Component

const NewSpendingForm = () => {
  /* NewSpendingForm here */

  //refs
  const dateRef = useRef(null);
  const amountRef = useRef(null);
  const descriptionRef = useRef(null);
  const dropdownRef = useRef(null);

  //states
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchFriend, setSearchFriend] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  // Store
  const spendingPayload = useSelector((store) => store.spendingPayload);
  const { user } = useSelector((store) => store.user);
  const { friends } = useSelector((store) => store.data);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Navigate to checkout page
  const handleNewSpending = (e) => {
    e.preventDefault();

    const payload = {
      date: dateRef.current.value,
      amount: amountRef.current.value,
      description: descriptionRef.current.value,
    };
    dispatch(setRefPayload(payload));
    dispatch(
      addContributor({ friend_name: user.username, amount: 0, isUser: true })
    );
    dispatch(splitAmountEqually());
    dispatch(savePayload(payload));
    navigate("/new-spending/checkout");
  };

  // Show friend list
  const handleFocus = (value) => {
    setTimeout(() => {
      window.scrollTo({
        top: window.screenY + 400,
        behavior: "smooth",
      });
    }, 100);
    setShowDropdown(value);
  };

  // Search friends
  const handleSearch = async (e) => {
    setSearchValue(e.target.value);
    try {
      const similarFriends = await friendsApi.getFriendLike(e.target.value);
      setSearchFriend(similarFriends.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Add unregistered friend
  const handleUnRegistered = () => {
    // console.log(searchValue);

    dispatch(
      addContributor({
        friend_id: Math.floor(Math.random() * 10),
        friend_name: searchValue,
        isRegistered: false,
        amount: 0,
      })
    );
    setSearchValue("");
  };

  const applyVoiceExpense = ({ amount, description, date }) => {
    if (amount !== null && amount !== undefined && amountRef.current) {
      amountRef.current.value = amount;
    }

    if (description && descriptionRef.current) {
      descriptionRef.current.value = description;
    }

    if (date && dateRef.current) {
      dateRef.current.value = date;
    }

    dispatch(
      setRefPayload({
        amount: amountRef.current?.value || "",
        description: descriptionRef.current?.value || "",
        date: dateRef.current?.value || formatDateForInput(),
      })
    );
  };

  return (
    <form
      className={spendingStyles.form.container}
      onSubmit={handleNewSpending}
    >
      <VoiceExpenseAssistant onApply={applyVoiceExpense} />

      <InputGroup
        label="Amount"
        placeholder="₹ XXXX"
        type="number"
        state={amountRef}
        defaultValue={spendingPayload.amount}
      />
      <InputGroup
        state={descriptionRef}
        label="Description"
        placeholder="eg. food/travel/shopping"
        type="text"
        defaultValue={spendingPayload.description}
      />
      <InputGroup
        label="Date"
        state={dateRef}
        type="date"
        defaultValue={spendingPayload.date || formatDateForInput()}
      />

      <SearchBar
        dropdownRef={dropdownRef}
        onFocus={handleFocus}
        handleSearch={handleSearch}
        value={searchValue}
      />

      <div className={spendingStyles.contributorList}>
        {spendingPayload.contributors.map((c) => (
          <Contributor contributor={c} key={c.friend_id || c.friend_name} />
        ))}
      </div>

      {showDropdown &&
        (searchValue ? (
          <ul className={spendingStyles.form.dropdown} ref={dropdownRef}>
            {searchFriend.length > 0 ? (
              <>
                <p className={spendingStyles.searchBar.label}>Results</p>
                {searchFriend.map((friend) => (
                  <FriendItem
                    key={friend.friend_id}
                    friend={friend}
                    setSearchValue={setSearchValue}
                  />
                ))}
              </>
            ) : (
              <div className={spendingStyles.form.unregistered.wrapper}>
                <p>No search results found</p>
                <div
                  className={spendingStyles.form.unregistered.btn}
                  onClick={handleUnRegistered}
                >
                  Add as temporary friend
                </div>
              </div>
            )}
          </ul>
        ) : (
          <ul className={spendingStyles.form.dropdown}>
            <p className={spendingStyles.searchBar.label}>Your friends</p>
            {friends &&
              friends.map((friend) => (
                <FriendItem
                  key={friend.friend_id}
                  friend={friend}
                  setShowDropdown={setShowDropdown}
                />
              ))}
          </ul>
        ))}

      <button className={spendingStyles.button}>Continue</button>
    </form>
  );
};

export default NewSpendingForm;

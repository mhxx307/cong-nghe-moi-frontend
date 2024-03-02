import { useEffect, useState } from 'react';
import { MdOutlineGroupAdd } from 'react-icons/md';
import { FaCamera } from 'react-icons/fa';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import { debounce } from 'lodash';

import ChatRoom from '../components/ChatRoom';
import { useChat } from '../hooks/useChat';
import userService from '../services/userService';
import chatService from '../services/chatService';
import { useAuth } from '../hooks/useAuth';
import socket from '../configs/socket';
import FallbackAvatar from '../components/FallbackAvatar';

function ChatPage() {
    const { selectedRoom, isSidebarVisible } = useChat();

    const renderChatRoom = () => {
        return (
            <div
                className={`flex-1 p-4 md:p-8 ${isSidebarVisible ? 'w-full md:pl-[270px] lg:pl-[270px]' : 'w-full'}`}
            >
                {selectedRoom ? (
                    <>
                        {/* <h2 className="text-2xl font-semibold mb-4">Chatting in {selectedRoom}</h2> */}
                        {/* Add your chat component here */}
                        {/* Example: <ChatRoom room={selectedRoom} /> */}
                        <ChatRoom room={selectedRoom} />
                    </>
                ) : (
                    <div className="text-center text-gray-600">
                        Select a user or group from the sidebar to start
                        chatting.
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-1 flex-col md:flex-row">
            <Sidebar />
            {renderChatRoom()}
        </div>
    );
}

export default ChatPage;

const Sidebar = () => {
    const { userVerified } = useAuth();
    const {
        selectedRoom,
        setSidebarVisibility,
        isSidebarVisible,
        setSelectedRoom,
        currentChatList,
        setCurrentChatList,
    } = useChat();
    const [searchTermUser, setSearchTermUser] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [open, setOpen] = useState(false);
    const onOpenModal = () => setOpen(true);
    const onCloseModal = () => setOpen(false);

    useEffect(() => {
        // listen for new chat
        socket.on('newChat', (data) => {
            // get all existing chats
            chatService
                .getAllExistingChats(userVerified._id)
                .then((chatList) => {
                    setCurrentChatList(chatList);
                });
        });

        return () => {
            // Clean up
            socket.off('newChat');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);

    useEffect(() => {
        // Fetch users when searchTermUser changes
        const fetchUsers = async () => {
            if (searchTermUser.trim() !== '') {
                try {
                    const result =
                        await userService.getUsersBySearchTerms(searchTermUser);
                    console.log('Fetched users:', result);
                    // Remove the current user from the search results
                    const filteredResult = result.filter(
                        (user) => user._id !== userVerified._id,
                    );
                    setSearchResults(filteredResult);
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            } else {
                setSearchResults([]);
            }
        };

        fetchUsers();
    }, [searchTermUser, userVerified._id]);

    const handleUserSelect = async (user) => {
        // Handle selecting a user, for example, start a new chat with the selected user
        console.log('Selected user:', user);
        // check if a chat already exists
        const existingChat = currentChatList.find(
            (chat) =>
                chat.sender._id === user._id || chat.receiver._id === user._id,
        );

        if (existingChat) {
            console.log('Chat already exists:', existingChat);
            setSelectedRoom(existingChat);
            return;
        } else {
            const chat = await chatService.start1v1Chat({
                senderId: userVerified._id,
                receiverId: user._id,
                message: 'Hello!',
            });
            console.log('Started 1v1 chat:', chat);
            // Emit a message event to the server
            socket.emit('message', {
                sender: userVerified,
                receiver: chat.receiver,
                message: 'Hello!',
                timestamp: new Date().toISOString(),
            });

            // Fetch chat list
            setSelectedRoom(chat);
        }

        // Clear the search term
        setSearchTermUser('');

        // fetch chat list
        const chatList = await chatService.getAllExistingChats(
            userVerified._id,
        );
        setCurrentChatList(chatList);
    };

    const handleRoomSelect = (room) => {
        setSelectedRoom(room);
    };

    const toggleSidebar = () => {
        setSidebarVisibility(!isSidebarVisible);
    };

    const handleOpenAddGroupModal = () => {
        // Open the modal to add a new group
        onOpenModal();
    };

    //    debounce function
    const delayedSearch = debounce((searchTerm) => {
        setSearchTermUser(searchTerm);
    }, 500);

    const handleSearchChange = (e) => {
        const term = e.target.value;
        delayedSearch(term);
    };

    return (
        <div
            className={`fixed flex h-full w-3/4 flex-col bg-gray-800 p-4 text-white transition-all duration-300 md:w-[270px] lg:w-[270px] ${
                isSidebarVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            <button
                className="absolute -right-[20px] top-1/2 -translate-y-1/2 transform text-xl text-[#000] focus:outline-none"
                onClick={toggleSidebar}
            >
                {isSidebarVisible ? '←' : '→'}
            </button>

            <div className="mb-4">
                <div className="mb-4 flex items-center justify-between">
                    <input
                        type="text"
                        className="focus:shadow-outline mr-2 w-full rounded bg-gray-700 px-4 py-2 text-white focus:outline-none"
                        placeholder="Search"
                        value={searchTermUser}
                        onChange={handleSearchChange}
                    />
                    <MdOutlineGroupAdd
                        className="cursor-pointer text-2xl hover:opacity-80"
                        onClick={handleOpenAddGroupModal}
                    />
                    <Modal open={open} onClose={onCloseModal} center>
                        <AddGroupModal
                            searchResults={searchResults}
                            onCloseModal={onCloseModal}
                        />
                    </Modal>
                </div>
                <ul>
                    {searchResults.map((user, index) => (
                        <li
                            key={user._id}
                            onClick={() => handleUserSelect(user)}
                        >
                            {user.username}
                        </li>
                    ))}
                </ul>
            </div>

            <h2 className="mb-4 text-2xl font-semibold">Chat Rooms</h2>
            <ul>
                {currentChatList.length > 0 ? (
                    currentChatList.map((room) => (
                        <li
                            key={room._id}
                            className={`mb-2 cursor-pointer rounded px-4 py-2 ${
                                selectedRoom && selectedRoom._id === room._id
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'hover:bg-gray-700'
                            }`}
                            onClick={() => handleRoomSelect(room)}
                        >
                            {/* avatar & username */}
                            <div className="flex items-center">
                                {room.profilePic ? (
                                    <img
                                        src={
                                            userVerified._id === room.sender._id
                                                ? room.receiver.profilePic
                                                : room.sender.profilePic
                                        }
                                        alt={room.username}
                                        className="h-10 w-10 rounded-full"
                                    />
                                ) : (
                                    <FallbackAvatar
                                        name={
                                            userVerified._id === room.sender._id
                                                ? room.receiver.username
                                                : room.sender.username
                                        }
                                    />
                                )}
                                <span className="ml-2">
                                    {userVerified._id === room.sender._id
                                        ? room.receiver.username
                                        : room.sender.username}
                                </span>
                            </div>
                        </li>
                    ))
                ) : (
                    <li className="text-center text-gray-600">
                        No chat rooms available
                    </li>
                )}
            </ul>
        </div>
    );
};

const AddGroupModal = ({ onCloseModal }) => {
    // State variables
    const [groupName, setGroupName] = useState('');
    const [groupImage, setGroupImage] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Function to fetch users based on search term
    useEffect(() => {
        const fetchUsers = async () => {
            if (searchTerm.trim() !== '') {
                try {
                    const result =
                        await userService.getUsersBySearchTerms(searchTerm);
                    setUserSearchResults(result);
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            } else {
                setUserSearchResults([]);
            }
        };
        fetchUsers();
    }, [searchTerm]);

    // Function to handle changes in group name
    const handleGroupNameChange = (e) => {
        setGroupName(e.target.value);
    };

    // Function to handle changes in group image
    const handleGroupImageChange = (e) => {
        const imageFile = e.target.files[0];
        setGroupImage(imageFile);
    };

    // Function to toggle user selection
    const toggleUserSelection = (user) => {
        const isSelected = selectedUsers.some((u) => u._id === user._id);
        if (isSelected) {
            setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    // Function to remove selected user
    const removeSelectedUser = (userId) => {
        setSelectedUsers(selectedUsers.filter((user) => user._id !== userId));
    };

    // Function to handle create group
    const handleCreateGroup = () => {
        console.log('Group Name:', groupName);
        console.log('Group Image:', groupImage);
        console.log('Selected Users:', selectedUsers);
        onCloseModal(); // Close the modal after group creation
    };

    // Function to handle search input with debounce
    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
    };

    return (
        <div className="flex h-full items-center justify-center">
            <div className="w-96 rounded bg-white p-6">
                <h2 className="mb-4 text-2xl font-semibold">
                    Create New Group
                </h2>

                <div className="mb-4 flex items-center">
                    <label
                        htmlFor="group-image"
                        className="mr-4 flex cursor-pointer items-center justify-center rounded-full bg-gray-300 p-4 hover:bg-gray-400"
                    >
                        <FaCamera className="text-xl" />
                        <input
                            type="file"
                            id="group-image"
                            className="hidden"
                            onChange={handleGroupImageChange}
                        />
                    </label>
                    <input
                        type="text"
                        className="flex-1 rounded border border-gray-300 px-4 py-2 focus:outline-none"
                        placeholder="Group Name"
                        value={groupName}
                        onChange={handleGroupNameChange}
                    />
                </div>

                {/* Search users */}
                <input
                    type="text"
                    className="mb-4 w-full rounded border border-gray-300 px-4 py-2 focus:outline-none"
                    placeholder="Search Users"
                    onChange={handleSearchChange}
                />

                {/* User search results */}
                <div className="mb-4 max-h-40 overflow-y-auto">
                    {userSearchResults.map((user) => (
                        <div
                            key={user._id}
                            className={`flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-100 ${selectedUsers.some((u) => u._id === user._id) && 'bg-blue-100'}`}
                            onClick={() => toggleUserSelection(user)}
                        >
                            <div className="flex items-center">
                                {user.profilePic ? (
                                    <img
                                        src={user.profilePic}
                                        alt={user.username}
                                        className="h-10 w-10 rounded-full"
                                    />
                                ) : (
                                    <FallbackAvatar name={user.username} />
                                )}

                                <span className="ml-2">{user.username}</span>
                            </div>
                            <span>
                                {selectedUsers.some(
                                    (u) => u._id === user._id,
                                ) && 'Selected'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Selected users */}
                <div className="mb-4">
                    {selectedUsers.map((user) => (
                        <div
                            key={user._id}
                            className="mb-2 flex items-center justify-between rounded-md bg-blue-100 px-4 py-2"
                        >
                            <div className="flex items-center">
                                {user.profilePic ? (
                                    <img
                                        src={user.profilePic}
                                        alt={user.username}
                                        className="h-8 w-8 rounded-full"
                                    />
                                ) : (
                                    <FallbackAvatar name={user.username} />
                                )}

                                <span className="ml-2">{user.username}</span>
                            </div>
                            <button
                                className="text-red-500"
                                onClick={() => removeSelectedUser(user._id)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                {/* Create group button */}
                <button
                    className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    onClick={handleCreateGroup}
                >
                    Create Group
                </button>
            </div>
        </div>
    );
};

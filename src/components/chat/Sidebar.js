import 'react-responsive-modal/styles.css';
import { useEffect, useState } from 'react';
import { MdOutlineGroupAdd } from 'react-icons/md';
import { IoMdPersonAdd } from 'react-icons/io';
import { FaPlus } from 'react-icons/fa';
import Modal from 'react-responsive-modal';
import { toast } from 'react-toastify';

import AddGroupModal from './AddGroupModal';
import { useAuth } from '~/hooks/useAuth';
import { useChat } from '~/hooks/useChat';
import useDebounce from '~/hooks/useDebounce';
import socket from '~/configs/socket';
import chatService from '~/services/chatService';
import userService from '~/services/userService';
import RoomSidebarItem from './RoomSidebarItem';
import { useTheme } from '~/hooks/useTheme';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
    const { userVerified } = useAuth();
    const {
        selectedRoom,
        setSidebarVisibility,
        isSidebarVisible,
        setSelectedRoom,
        roomList,
        setRoomList,
        fetchUpdatedRooms,
    } = useChat();
    const [searchTermUser, setSearchTermUser] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [open, setOpen] = useState(false);
    const onOpenModal = () => setOpen(true);
    const onCloseModal = () => setOpen(false);
    const searchTermUserDebounce = useDebounce(searchTermUser, 500);
    const { isDarkMode, themeStyles } = useTheme();

    const { t } = useTranslation();
    // console.log('Current chat list:', roomList);

    // Fetch users when searchTermUser changes
    useEffect(() => {
        const fetchUsers = async () => {
            if (searchTermUserDebounce.trim() !== '') {
                try {
                    const result = await userService.getUsersBySearchTerms(
                        searchTermUserDebounce,
                    );
                    // console.log('Fetched users:', result);
                    // Remove the current user from the search results
                    const filteredResult = result.filter(
                        (user) => user._id !== userVerified._id,
                    );

                    console.log('Filtered users:', filteredResult);

                    setSearchResults(filteredResult);
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            } else {
                setSearchResults([]);
            }
        };

        fetchUsers();
    }, [searchTermUserDebounce, userVerified._id]);

    // listen for socket events
    useEffect(() => {
        socket.on('created-room', (data) => {
            console.log('Received created room event:', data);
            setRoomList((prevRoomList) => [...prevRoomList, data.createdRoom]);
        });

        socket.on('sorted-room', (data) => {
            fetchUpdatedRooms();
        });

        return () => {
            socket.off('created-room');
            socket.off('sorted-room');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);

    const handleUserSelect = async (user) => {
        try {
            // Create a chat room with the selected user
            const members = [userVerified._id, user._id];
            const response = await chatService.createChatRoom({
                members,
                type: '1v1',
            });
            console.log('Created chat room:', response);

            // check if the chat room already exists
            const existingChatroom = roomList.find(
                (room) => room._id === response._id,
            );

            if (existingChatroom) {
                // Set the selected room to the existing chat room
                setSelectedRoom(existingChatroom);
                return;
            } else {
                // Add the new chat room to the list of chat rooms
                setRoomList([...roomList, response]);
                setSelectedRoom(response);

                // Emit a socket event to the server to notify the other user
                socket.emit('create-room', {
                    createdRoom: response,
                });
            }
        } catch (error) {
            console.error('Error creating chat room:', error);
            toast.error(error);
        }
    };

    const handleAddFriend = async (user) => {
        console.log('Adding friend:', user);
        try {
            const response = await userService.sendFriendRequest({
                senderId: userVerified._id,
                receiverId: user._id,
            });
            console.log('Friend request sent:', response);
            toast.success('Friend request sent');

            socket.emit('send-friend-request', response);
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error(error);
        }
    };

    const handleRoomSelect = (room) => {
        setSelectedRoom(room);
    };

    const toggleSidebar = () => {
        setSidebarVisibility(!isSidebarVisible);
    };

    const handleOpenAddGroupModal = () => {
        onOpenModal();
    };

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTermUser(term);
    };

    // check if the user is already a friend
    const isFriend = (user) => {
        return userVerified.friends.some((friend) => friend._id === user._id);
    };

    return (
        <div
            className={`fixed flex h-full w-3/4 flex-col ${isDarkMode ? 'bg-[#212326] text-white' : 'bg-gray-100 text-black'} p-4  transition-all duration-300 md:w-[270px] lg:w-[270px] ${
                isSidebarVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            <button
                className="absolute -right-[20px] top-1/2 -translate-y-1/2 transform text-xl text-[#000] focus:outline-none"
                onClick={toggleSidebar}
            >
                {isSidebarVisible ? t('collapse_sidebar') : t('expand_sidebar')}
            </button>

            <div className="relative mb-4">
                <div className="mb-4 flex items-center justify-between">
                    <input
                        type="text"
                        className={`focus:shadow-outline mr-2 w-full rounded px-4 py-2 focus:outline-none ${isDarkMode ? 'bg-[#2c2c30] text-white' : 'bg-[#ffffff] text-black'}`}
                        placeholder={`${t('search')}...`}
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
                            userVerified={userVerified}
                        />
                    </Modal>
                </div>
                {/* search list */}
                {searchResults.length > 0 && (
                    <ul
                        className={`absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-lg ${isDarkMode ? 'bg-[#2c2c30] text-white' : 'bg-[#ffffff] text-black'} shadow-lg`}
                    >
                        {searchResults.map((user) =>
                            isFriend(user) ? (
                                <li
                                    key={user._id}
                                    onClick={() => handleUserSelect(user)}
                                    className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-700"
                                >
                                    <p>{user.username}</p>
                                </li>
                            ) : (
                                <li
                                    key={user._id}
                                    onClick={() => handleAddFriend(user)}
                                    className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-700"
                                >
                                    <p>{user.username}</p>
                                    <IoMdPersonAdd />
                                </li>
                            ),
                        )}
                    </ul>
                )}
            </div>

            <h2 className="mb-4 text-2xl font-semibold">{t('chat')}</h2>
            <ul className="h-[100%] overflow-y-auto">
                {roomList.length > 0 ? (
                    roomList.map((room) => (
                        <RoomSidebarItem
                            key={room._id}
                            room={room}
                            handleRoomSelect={handleRoomSelect}
                            selectedRoom={selectedRoom}
                        />
                    ))
                ) : (
                    <li className="text-center text-gray-600">
                        {t('no_chat_rooms_available')}
                    </li>
                )}
            </ul>

            <div className="fixed bottom-5 right-5">
                <button className="rounded-full bg-blue-500 p-3 shadow-lg transition duration-200 hover:bg-blue-600">
                    <FaPlus className="text-white" />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

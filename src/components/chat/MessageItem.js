import { useAuth } from '~/hooks/useAuth';
import FallbackAvatar from '../shared/FallbackAvatar';
import Popover from '../shared/Popover';
import { FaReply } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useState } from 'react';
import Modal from 'react-responsive-modal';

function MessageItem({ message, onReply, onDelete }) {
    const { userVerified } = useAuth();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    console.log(message); // gio em kiem tra, neu ma message no co images, em tu tim cho nao hien thi cho dep giup a nha

    const openModal = () => {
        setIsDeleteModalOpen(true);
    };

    const handleReply = () => {
        onReply(message);
    };

    const handleDelete = () => {
        onDelete(message);
    };

    const handleReferenceMessage = (message) => {
        const referencedMessageId = message.replyTo._id; // Assuming the ID of the referenced message is stored in message.replyTo._id
        const referencedMessageElement =
            document.getElementById(referencedMessageId);

        if (referencedMessageElement) {
            referencedMessageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            });
        }
    };
    
    return (
        <div
            id={message._id}
            className={
                message.sender._id === userVerified._id
                    ? 'mb-4 flex flex-col items-end'
                    : 'mb-4 flex flex-col items-start'
            }
        >
            {message.sender._id === userVerified._id ? (
                <div className="mb-4 flex flex-col items-end">
                    {/* reply message */}
                    {message.replyTo && (
                        <ReplyMessageItem
                            message={message}
                            handleReferenceMessage={handleReferenceMessage}
                        />
                    )}
    
                    <div className="flex space-x-2 items-center">
                        <Popover
                            placement="left"
                            renderPopover={
                                <Options
                                    onReply={handleReply}
                                    openModal={openModal}
                                    message={message}
                                />
                            }
                        >
                            <div className="max-w-[100%] rounded-md bg-blue-500 p-2 text-white">
                                {message.content}
                            </div>
                        </Popover>
                        {message.sender.profilePic ? (
                            <img
                                src={message.sender.profilePic}
                                alt="profile"
                                className="h-6 w-6 rounded-full"
                            />
                        ) : (
                            <FallbackAvatar
                                name={message.sender.username}
                            />
                        )}
                    </div>
    
                    {message.images && message.images.length > 0 && (
                        <div className="flex flex-wrap justify-start mt-2">
                            {message.images.map((imageUrl, index) => (
                                <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`Image ${index}`}
                                    className="message-image max-w-[200px] max-h-[200px] mr-2 mb-2 rounded-lg shadow-md"
                                />
                            ))}
                        </div>
                    )}
    
                    <div className="mt-1 text-xs text-gray-300">
                        {new Date(message.timestamp).toLocaleString()}
                    </div>
                </div>
            ) : (
                <div className="mb-4 flex flex-col items-start">
                    {/* reply message */}
                    {message.replyTo && (
                        <ReplyMessageItem
                            message={message}
                            handleReferenceMessage={handleReferenceMessage}
                        />
                    )}
    
                    <div className="flex space-x-2 items-center">
                        {message.sender.profilePic ? (
                            <img
                                src={message.sender.profilePic}
                                alt="profile"
                                className="h-6 w-6 rounded-full"
                            />
                        ) : (
                            <FallbackAvatar
                                name={message.sender.username}
                            />
                        )}
    
                        <Popover
                            placement="right"
                            renderPopover={
                                <Options
                                    onReply={handleReply}
                                    openModal={openModal}
                                    message={message}
                                />
                            }
                        >
                            <div className="max-w-[100%] rounded-md bg-gray-300 p-2">
                                {message.content}
                            </div>
                        </Popover>
                    </div>
    
                    {message.images && message.images.length > 0 && (
                        <div className="flex flex-wrap justify-start mt-2">
                            {message.images.map((imageUrl, index) => (
                                <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`Image ${index}`}
                                    className="message-image max-w-[200px] max-h-[200px] mr-2 mb-2 rounded-lg shadow-md"
                                />
                            ))}
                        </div>
                    )}
    
                    <div className="mt-1 text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                    </div>
                </div>
            )}
    
            {/* modal confirm delete */}
            <Modal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                center
            >
                <div className="p-4">
                    <h2>Are you sure you want to delete this message?</h2>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="rounded-md bg-gray-300 p-2"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="rounded-md bg-red-500 p-2 text-white"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    ); 
}

export default MessageItem;

const Options = ({ onReply, openModal }) => {
    return (
        <div className="flex space-x-2">
            <button
                onClick={() => openModal()}
                className="flex items-center space-x-1 text-red-500"
            >
                <MdDelete />
            </button>
            <button onClick={onReply} className="flex items-center space-x-1">
                <FaReply />
            </button>
        </div>
    );
};

const ReplyMessageItem = ({ message, handleReferenceMessage }) => {
    return (
        <div
            className="mb-2 cursor-pointer rounded-md bg-gray-300 p-2"
            onClick={() => handleReferenceMessage(message)}
        >
            <div className="text-xs text-gray-500">
                {message.replyTo.sender.username} replied:
            </div>
            <div>{message.replyTo.content}</div>
        </div>
    );
};

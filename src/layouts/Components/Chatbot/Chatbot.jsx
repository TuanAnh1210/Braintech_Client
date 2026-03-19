import { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faXmark, faPaperPlane, faRobot } from '@fortawesome/free-solid-svg-icons';
import styles from './Chatbot.module.scss';

const cx = classNames.bind(styles);

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([
        { role: 'model', text: 'Chào bạn! Tôi là trợ lý ảo của Braintech. Tôi có thể giúp gì cho bạn?' },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [history]);

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userMsg = { role: 'user', text: message };
        setHistory((prev) => [...prev, userMsg]);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(import.meta.env.VITE_REACT_APP_API_PATH + 'api/chatbot/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: history.slice(1), // Exclude the initial welcome message
                }),
            });

            const data = await response.json();
            setHistory((prev) => [...prev, { role: 'model', text: data.message }]);
        } catch (error) {
            console.error('Chatbot error:', error);
            setHistory((prev) => [
                ...prev,
                { role: 'model', text: 'Xin lỗi, tôi đang gặp chút sự cố. Vui lòng thử lại sau.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cx('wrapper')}>
            {/* Chat button */}
            <div className={cx('chat-button', { open: isOpen })} onClick={() => setIsOpen(!isOpen)}>
                <FontAwesomeIcon icon={isOpen ? faXmark : faMessage} />
            </div>

            {/* Chat window */}
            <div className={cx('chat-window', { active: isOpen })}>
                <div className={cx('header')}>
                    <div className={cx('info')}>
                        <div className={cx('avatar')}>
                            <FontAwesomeIcon icon={faRobot} />
                        </div>
                        <div>
                            <h4 className={cx('name')}>Braintech Consultant</h4>
                            <span className={cx('status')}>Trực tuyến</span>
                        </div>
                    </div>
                </div>

                <div className={cx('body')} ref={chatBodyRef}>
                    {history.map((item, index) => (
                        <div key={index} className={cx('message-wrapper', item.role)}>
                            <div className={cx('message')}>{item.text}</div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className={cx('message-wrapper', 'model')}>
                            <div className={cx('message', 'loading')}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={cx('footer')}>
                    <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} disabled={isLoading || !message.trim()}>
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;

/* eslint-disable react/prop-types */
import Footer from '../Components/Footer/Footer';
import Header from '../Components/Header/Header';
import Chatbot from '../Components/Chatbot/Chatbot';

const DefaultLayout = ({ children }) => {
    return (
        <div className="main">
            <Header />
            <div style={{ paddingTop: 'var(--height-header)' }}>{children}</div>
            <Footer />
            <Chatbot />
        </div>
    );
};

export default DefaultLayout;

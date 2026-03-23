/* eslint-disable react-hooks/exhaustive-deps */
import classNames from 'classnames/bind';
import styles from './DetailCourse.module.scss';
import { Col, Container, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '@/providers/slices/modalSlice';
import { useGetFinishLessonByCourseIdQuery } from '@/providers/apis/lessonApi';
import { useCreatePaymentUrlMutation } from '@/providers/apis/paymentApi';
import { useCookies } from 'react-cookie';
import {
    Breadcrumb,
    Button,
    Empty,
    Form,
    Input,
    Modal,
    Rate,
    message,
    notification,
    Select,
    Tag,
    Typography,
} from 'antd';
// import { TicketOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useGetAllPaymentByUserQuery } from '@/providers/apis/paymentDetail';
import { useAddSttCourseMutation } from '@/providers/apis/sttCourseApi';

const { Option } = Select;
const { Text } = Typography;
import RatingSide from './RatingSide';
import { useGetUserByIdQuery } from '@/providers/apis/userApi';
import { useGetDetailQuery } from '@/providers/apis/courseTeacherApi';

const cx = classNames.bind(styles);

const DetailCourse = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { courseId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [handleAddSttCourse] = useAddSttCourseMutation();
    const [cookies] = useCookies(['cookieLoginStudent']);
    const [createPaymentUrl] = useCreatePaymentUrlMutation();
    const [valueVoucher, setValueVoucher] = useState(0);
    const [isApplyVoucher, setApplyVoucher] = useState(false);
    const isLog = cookies.cookieLoginStudent;

    const { data: currentUser } = useGetUserByIdQuery();
    const { data: course } = useGetDetailQuery(courseId);
    const { data: lessonFinish } = useGetFinishLessonByCourseIdQuery(courseId, {
        skip: !courseId,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (isLog != null) {
            setIsLogin(true);
        } else {
            setIsLogin(false);
        }
    }, [isLog]);

    useEffect(() => {
        if (cookies === 'null' && cookies) {
            dispatch(openModal('login'));
        }
    }, [cookies]);

    const handleBuyCourse = async () => {
        if (!isLogin) {
            dispatch(openModal('login'));
            return;
        }
        try {
            const res = await createPaymentUrl({ courseId: courseId, voucherPrice: valueVoucher }).unwrap();
            if (res && res.url) {
                location.href = res.url;
            } else {
                message.error('Lỗi: Không nhận được URL thanh toán từ máy chủ.');
            }
        } catch (error) {
            console.error('Lỗi thanh toán:', error);
            message.error(error?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán.');
        }
    };

    const { data: coursePay, isLoading: coursePayLoading, refetch } = useGetAllPaymentByUserQuery();
    const dataBought = coursePay?.data?.find((s) => s.course_id?._id === courseId && s.status === 'SUCCESS');

    const data = cookies?.cookieLoginStudent;
    console.log(course);
    // const nextlessonId = lessonFinish?.data?.lesson_id || course?.course?.chapters?.[0]?.lessons?.[0]?._id;

    const nextlessonId = lessonFinish?.chapters
        ?.find((chapter) => chapter.isPublic)
        ?.lessons.find((lesson) => lesson.isPublic)?._id;
    const isPublicExist = course?.course?.chapters?.find((chapter) => !chapter.isPublic);
    const handleLearn = () => {
        handleAddSttCourse({ course_id: courseId }).then(() => {
            refetch();
            navigate(`/learning/teacher/${courseId}/${nextlessonId}`);
        });
    };
    //     useEffect(() => {
    //         if (cookies.cookieLoginStudent) {
    //             const decode = jwtDecode(data?.accessToken);
    //             setUserid(decode._id);
    //         } else {
    //             navigate('/');
    //         }
    //     }, [cookies]);

    const formattedArray = useMemo(() => {
        const countMap = {};
        currentUser?.vouchers?.forEach((obj) => {
            const key = JSON.stringify(obj);
            countMap[key] = (countMap[key] || 0) + 1;
        });

        const newArray = [];
        Object.keys(countMap).forEach((key) => {
            const obj = JSON.parse(key);
            newArray.push({ ...obj, quantity: countMap[key] });
        });

        return newArray;
    }, [currentUser]);

    const handleChangeVoucher = (voucherId) => {
        if (voucherId === '0') {
            setValueVoucher(course?.course?.price);
            setApplyVoucher(false);
        } else {
            const selectedVoucher = (formattedArray || []).find((voucher) => voucher._id === voucherId);
            if (selectedVoucher) {
                const discount = (course?.course?.price * selectedVoucher.discountAmount) / 100;
                const finalPrice = Math.max(
                    course?.course?.price - Math.min(discount, selectedVoucher.maxDiscountAmount),
                    0,
                );
                setValueVoucher(finalPrice);
                setApplyVoucher(true);
            }
        }
    };
    return (
        <>
            <div className={cx('detail-course')}>
                <Container>
                    <Breadcrumb
                        className="mb-4"
                        items={[{ title: 'Trang chủ' }, { title: 'Khóa học' }, { title: course?.course?.name }]}
                    />
                    <Row>
                        <Col lg={8}>
                            <div>
                                <h2 className={cx('course_name')}>{course?.course?.name}</h2>

                                <p className={cx('course_text')}>{course?.course?.description}</p>
                                <p>
                                    Giảng viên :{' '}
                                    {course?.course?.teacherId
                                        ?.slice(0, 2)
                                        ?.map((role) => role.full_name)
                                        .join(' &  ')}{' '}
                                </p>
                                <div className={cx('learning__bar')}>
                                    <h1 className={cx('learning__bar--title')}>Nội dung khóa học</h1>

                                    <div className={cx('course_topic')}>
                                        {course?.course?.chapters
                                            ?.filter((chapter) => chapter.isPublic)
                                            .map((chapter) => {
                                                return (
                                                    <div
                                                        key={chapter._id}
                                                        className={cx(
                                                            'learning__chapter',
                                                            !chapter.isPublic && 'hidden',
                                                        )}
                                                    >
                                                        <h3 className={cx('learning__chapter--txt')}>{chapter.name}</h3>

                                                        {chapter.lessons
                                                            ?.filter((lesson) => lesson.isPublic)
                                                            .map((lesson, index) => (
                                                                <div key={lesson._id} className={cx('trackItem')}>
                                                                    <h3 className={cx('trackItem--title')}>
                                                                        {index + 1}. {lesson.name}
                                                                        <span>
                                                                            <FontAwesomeIcon
                                                                                style={{ color: '#f76b1c' }}
                                                                                icon={faGraduationCap}
                                                                            />
                                                                        </span>
                                                                    </h3>
                                                                </div>
                                                            ))}
                                                    </div>
                                                );
                                            })}

                                        {(course?.course?.chapters.length === 0 || isPublicExist) && (
                                            <Empty className="my-8" description="Chưa có dữ liệu" />
                                        )}
                                        <RatingSide idCourse={courseId} />
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col lg={4}>
                            <div className="course_img_wrapper">
                                <img className={cx('course_img')} src={course?.course?.thumb} alt="" />
                                {course?.course?.price > 0 && (
                                    <div className={cx('voucher-container')}>
                                        <h3 className="flex items-center gap-2 text-gray-800 font-semibold mb-4 border-b pb-3">
                                            {/* <TicketOutlined className="text-blue-500 text-xl" /> Áp dụng mã giảm giá */}
                                            <p>Áp dụng mã giảm giá</p>
                                        </h3>
                                        <div className={cx('select-wrapper')}>
                                            <Select
                                                className={cx('custom-select')}
                                                style={{ width: '100%', minHeight: '45px' }}
                                                placeholder="Chọn mã giảm giá"
                                                onChange={(value) => handleChangeVoucher(value)}
                                                defaultValue="0"
                                                dropdownStyle={{
                                                    padding: 8,
                                                    borderRadius: 12,
                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                                }}
                                                optionLabelProp="label"
                                                size="large"
                                            >
                                                <Option value="0" label="Không sử dụng mã giảm giá">
                                                    <div className="py-2 font-medium text-gray-600">
                                                        Không sử dụng mã giảm giá
                                                    </div>
                                                </Option>
                                                {formattedArray?.map((voucher) => {
                                                    const isEligible = course.course.price >= voucher.conditionAmount;
                                                    return (
                                                        <Option
                                                            key={voucher._id}
                                                            value={voucher._id}
                                                            disabled={!isEligible}
                                                            label={`Giảm ${voucher.discountAmount}%`}
                                                            className={cx('voucher-option', { disabled: !isEligible })}
                                                        >
                                                            <div
                                                                className={cx('voucher-item', {
                                                                    'opacity-50': !isEligible,
                                                                })}
                                                            >
                                                                <div className={cx('voucher-info')}>
                                                                    <Text
                                                                        strong
                                                                        className={cx('voucher-title', {
                                                                            'text-gray-400': !isEligible,
                                                                        })}
                                                                    >
                                                                        Giảm {voucher.discountAmount}% (Tối đa{' '}
                                                                        {voucher.maxDiscountAmount.toLocaleString()}đ)
                                                                    </Text>
                                                                    <div
                                                                        className={cx('voucher-condition', {
                                                                            'text-gray-500': !isEligible,
                                                                        })}
                                                                    >
                                                                        Đơn tối thiểu{' '}
                                                                        {voucher.conditionAmount.toLocaleString()}đ
                                                                    </div>
                                                                </div>
                                                                <Tag
                                                                    color={isEligible ? 'blue-inverse' : 'default'}
                                                                    className={cx('voucher-qty')}
                                                                >
                                                                    x{voucher.quantity}
                                                                </Tag>
                                                            </div>
                                                        </Option>
                                                    );
                                                })}
                                            </Select>
                                        </div>

                                        <div className={cx('applied-voucher-wrap')}>
                                            {isApplyVoucher ? (
                                                <div className={cx('applied-vch-success')}>
                                                    <CheckCircleOutlined className="mr-2" />
                                                    Đã áp dụng thành công
                                                </div>
                                            ) : (
                                                <div className={cx('applied-vch-empty')}>
                                                    <InfoCircleOutlined className="mr-2" />
                                                    Chưa áp dụng mã giảm giá
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {!dataBought && course?.course?.price > 0 ? (
                                    <>
                                        <div className={cx('price__wrapper')}>
                                            <p className={cx('old__price')}>
                                                {course?.course?.old_price.toLocaleString()}đ
                                            </p>
                                            <p className={cx('price_cur')}>
                                                {Math.round(valueVoucher || course?.course?.price)}đ
                                            </p>
                                        </div>
                                        <a onClick={handleBuyCourse}>
                                            <button className={cx('course_btn-learn')}>Mua ngay</button>
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <h4 className={cx('course_free')}>
                                            {course?.course?.price > 0 && dataBought ? 'Đã mua' : 'Miễn phí'}
                                        </h4>
                                        <div className={cx('firstLessonBtn')}>
                                            {isLogin ? (
                                                <button className={cx('course_btn-learn')} onClick={handleLearn}>
                                                    Học ngay
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        dispatch(openModal('login'));
                                                    }}
                                                    className={cx('course_btn-learn')}
                                                >
                                                    Học ngay
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default DetailCourse;

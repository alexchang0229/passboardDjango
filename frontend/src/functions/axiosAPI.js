import axios from 'axios'
import Cookies from 'js-cookie';

const baseURL = '/api/'
const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-CSRFToken': Cookies.get('csrftoken')
    }
});


export default axiosInstance

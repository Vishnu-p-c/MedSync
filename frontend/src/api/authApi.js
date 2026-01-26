import axiosInstance from '../utils/axiosInstance';

export const loginUser = async (username , password) =>{
    try{
        const res = await axiosInstance.post("/login", {username, password});
        return res.data;
    }
    catch(err){
        return {    error: err.response ? err.response.data : "Network Error"};
    }
}
import axios from 'axios';

const URL = "http://localhost:8080"

export const userLogin = async (formData) => {
    const response = await axios.post(`${URL}/login/`, formData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response;
}

export const userRegister = async (formData) => {
    const response = await axios.post(`${URL}/register/`, formData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response;
}

export const createRoom = async (formData) => {
    const response = await axios.post(`${URL}/createRoom/`, formData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    console.log("createRoom:  ", response)
    return response;
}

export const getLastRoomId = async () => {
    const response = await axios.get(`${URL}/lastRoomID/`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
}

export const getMyRooms = async (formData) => {
    const response = await axios.get(`${URL}/getMyRooms/${formData.user_id}`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response;
}

export const createFlashcard = async (formData) => {
    const response = await axios.post(`${URL}/createFlashcard`, formData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    console.log("createFalsh card: ", response)
    return response;
}

export const getRoomFlashcards = async (roomId) => {
    const response = await axios.get(`${URL}/roomFlashCards/${roomId}`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    console.log(response.data)
    return response.data;

} 
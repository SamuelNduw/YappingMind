import { useState, useRef, useContext, useEffect } from 'react'
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext';
import { userLogin, userRegister } from '../services/flashcardApp'
import Cookies from 'js-cookie'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    profilePicture: 'example.com',
    isAdmin: false

  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin){
      try {
        const response = await userRegister(formData);
  
        console.log(response.data);
        alert('Registration Successful');
        if(response.status === 200 || 201){
          const userData = response.data;
          login(userData);
          Cookies.set('user_id', userData.user_id, { expires: 7});
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('There was an error registering the user!', error);
        alert('Registration Failed');
      }
    } else{
      try {
        const response = await userLogin(formData);
        
        console.log(response.data);
        alert('Login Successful');
        if(response.status === 200 || 201){
          const userData = response.data;
          login(userData)
          Cookies.set('user_id', userData.user_id, { expires: 7});
          navigate('/dashboard'); 
        }
      } catch (error) {
        console.error('There was an error logging in!', error);
        alert('Login Failed');
      }
    }
  };

  const triggerSubmit = () => {
    formRef.current.requestSubmit();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Welcome back! Please login to your account."
              : "Create an account to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Username</Label>
                  <Input id="name" placeholder="John Doe" name="username" value={formData.username} onChange={handleChange}/>
                </div>
              {!isLogin && (
                <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="john@example.com" name="email" type="email" value={formData.email} onChange={handleChange}/>
              </div>
              )}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" name="password" value={formData.password} onChange={handleChange}/>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full" onClick={triggerSubmit}>{isLogin ? "Login" : "Sign Up"}</Button>
          <p className="mt-2 text-sm text-center">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <a
              href="#"
              className="text-blue-600 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                setIsLogin(!isLogin)
              }}
            >
              {isLogin ? "Sign Up" : "Login"}
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
import React, { useState, useContext, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Brain, FileText, MessageCircle, MessageSquare, Plus, Search, ThumbsDown, ThumbsUp, Users, X, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AuthContext from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getMyRooms, createRoom, createFlashcard, getLastRoomId, getRoomFlashcards } from '@/services/flashcardApp'


const groups = [
  { id: 1, title: "Biology Study Group", memberCount: 15, nextMeeting: "Tomorrow, 3 PM" },
  { id: 2, title: "Spanish Language Exchange", memberCount: 32, activeDiscussion: "Verb conjugations" },
]

const mockFlashcards = [
  { id: 1, question: "What is the capital of France?", answer: "Paris", comments: [] },
  { id: 2, question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare", comments: [] },
  { id: 3, question: "What is the chemical symbol for water?", answer: "H2O", comments: [] },
]

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [creationMethod, setCreationMethod] = useState('manual')
    const [myRooms, setMyRooms] = useState([])
    const [activeView, setActiveView] = useState('dashboard')
    const [activeGroup, setActiveGroup] = useState(null)
    const [activeFlashcardSet, setActiveFlashcardSet] = useState(null)
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [comment, setComment] = useState("")
    const [groupDiscussion, setGroupDiscussion] = useState("")
    const [flashcards, setFlashcards] = useState(mockFlashcards)
    const [selectedRoom, setSelectedRoom] = useState("")
    const [newRoomName, setNewRoomName] = useState("")
    const [isCreatingNewRoom, setIsCreatingNewRoom] = useState(false)
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyRooms = async () => {
            const response = await getMyRooms(user);
            setMyRooms(response.data)
            console.log(response.data)
        };
        fetchMyRooms();
    }, []);

    const [newRoom, setNewRoom] = useState({
        room_name : '',
        created_by: user.user_id,
        is_public: 1
    });

    

    const handleChangeRoom = (value) => {
        setNewRoom({
            ...newRoom,
            room_name: value
        });
        setNewRoomName(value);
    };

    const flashcardCreation = async () => {
        try {
            let roomId;
            if (selectedRoom === "new") {
                const roomResponse = await createRoom(newRoom);
                console.log(roomResponse);
                const roomIdResponse = await getLastRoomId();
                roomId = roomIdResponse[0].room_id;
                console.log(roomId);
                alert('Room successfully created.');
            } else {
                roomId = selectedRoom;
            }
    
            const flashcardData = {
                room_id: roomId,
                created_by: user.user_id,
                question: document.getElementById('question').value,
                answer: document.getElementById('answer').value,
                source_doc: " ",
                ai_generated: false
            };

            console.log(flashcardData);
    
            const flashcardResponse = await createFlashcard(flashcardData);
            console.log(flashcardResponse);
            alert('Flashcard successfully created.');
    
            // Update the list of rooms and cards
            const updatedRooms = await getMyRooms(user);
            setMyRooms(updatedRooms.data);
    
            // Close the modal
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating flashcard:', error);
            alert('An error occurred while creating the flashcard. Please try again.');
        }
    };

    const fetchFlashcardsForRoom = async (roomId) => {
        try{
            const flashCardsResponse = await getRoomFlashcards(roomId);
            setFlashcards(flashCardsResponse);
        }catch(e){
            console.log(e)
        }
    }
  
    const handleNextCard = () => {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length)
      setIsFlipped(false)
    }
  
    const handlePrevCard = () => {
      setCurrentCardIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length)
      setIsFlipped(false)
    }
  
    const handleFlip = () => {
      setIsFlipped(!isFlipped)
    }
  
    const handleCommentSubmit = (e) => {
      e.preventDefault()
      if (comment.trim()) {
        const updatedFlashcards = [...flashcards]
        updatedFlashcards[currentCardIndex].comments.push({ id: Date.now(), text: comment, user: "John Doe" })
        setFlashcards(updatedFlashcards)
        setComment("")
      }
    }
  
    const handleGroupDiscussionSubmit = (e) => {
      e.preventDefault()
      if (groupDiscussion.trim()) {
        console.log("New group discussion message:", groupDiscussion)
        setGroupDiscussion("")
      }
    }
  
    const renderDashboard = () => (
      <>
        <div className="flex space-x-4 mb-8">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Create Flashcard
          </Button>
          <Button variant="outline">
            <Users className="h-5 w-5 mr-2" />
            Join Group
          </Button>
        </div>
  
        <Tabs defaultValue="flashcards" className="mb-8">
          <TabsList>
            <TabsTrigger value="flashcards">My Flashcards</TabsTrigger>
            <TabsTrigger value="groups">My Groups</TabsTrigger>
          </TabsList>
          <TabsContent value="flashcards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRooms.map((set) => (
                <Card key={set.room_id} onClick={() => {
                  setActiveFlashcardSet(set)
                  fetchFlashcardsForRoom(set.room_id)
                  setActiveView('flashcards')
                }} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{set.room_name}</CardTitle>
                    <CardDescription>{20} cards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={20} className="mb-2" />
                    <p className="text-sm text-gray-500">20% complete</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="groups">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <Card key={group.id} onClick={() => {
                  setActiveGroup(group)
                  setActiveView('group')
                }} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription>{group.memberCount} members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-2">
                      {group.nextMeeting ? `Next meeting: ${group.nextMeeting}` : `Active discussion: ${group.activeDiscussion}`}
                    </p>
                    <Button variant="outline" size="sm">View Group</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </>
    )
  
    const renderFlashcards = () => (
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <Button variant="outline" onClick={() => setActiveView('dashboard')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <Card className="w-full h-96 flex items-center justify-center cursor-pointer" onClick={handleFlip}>
            <CardContent className="text-center p-6">
              <h2 className="text-2xl font-semibold mb-4">
                {isFlipped ? "Answer" : "Question"}
              </h2>
              <p className="text-xl">
                {isFlipped ? flashcards[currentCardIndex].answer : flashcards[currentCardIndex].question}
              </p>
            </CardContent>
          </Card>
          
          <div className="flex justify-between items-center mt-4">
            <Button onClick={handlePrevCard}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <div className="text-sm text-gray-500">
              Card {currentCardIndex + 1} of {flashcards.length}
            </div>
            <Button onClick={handleNextCard}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-center mt-4 space-x-4">
            <Button variant="outline" size="sm">
              <ThumbsUp className="mr-2 h-4 w-4" /> Got it
            </Button>
            <Button variant="outline" size="sm">
              <ThumbsDown className="mr-2 h-4 w-4" /> Need review
            </Button>
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <h3 className="text-xl font-semibold mb-4">Comments</h3>
          <ScrollArea className="h-96 w-full rounded-md border p-4">
            <div className="space-y-4">
              {/* {flashcards[currentCardIndex].comments.map((comment) => (
                <div key={comment.id} className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>{comment.user[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{comment.user}</span>
                  </div>
                  <p>{comment.text}</p>
                </div>
              ))} */}
            </div>
          </ScrollArea>
          <form onSubmit={handleCommentSubmit} className="space-y-2 mt-4">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button type="submit" className="w-full">
              <MessageSquare className="mr-2 h-4 w-4" /> Post Comment
            </Button>
          </form>
        </div>
      </div>
    )
  
    const renderGroupRoom = () => (
      <div className="flex flex-col gap-8">
        <Button variant="outline" onClick={() => setActiveView('dashboard')} className="self-start">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h2 className="text-3xl font-bold">{activeGroup.title}</h2>
        <Tabs defaultValue="discussion">
          <TabsList>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          </TabsList>
          <TabsContent value="discussion">
            <Card>
              <CardHeader>
                <CardTitle>Group Discussion</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">John Doe</span>
                      </div>
                      <p>Has anyone started on the chapter 5 review?</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>JS</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">Jane Smith</span>
                      </div>
                      <p>I'm working on it now. The concepts are quite challenging!</p>
                    </div>
                  </div>
                </ScrollArea>
                <form onSubmit={handleGroupDiscussionSubmit} className="space-y-2 mt-4">
                  <Textarea
                    placeholder="Add to the discussion..."
                    value={groupDiscussion}
                    onChange={(e) => setGroupDiscussion(e.target.value)}
                  />
                  <Button type="submit" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" /> Post Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-500">Group Leader</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Jane Smith</p>
                      <p className="text-sm text-gray-500">Member</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="flashcards">
            <Card>
              <CardHeader>
                <CardTitle>Group Flashcards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Chapter 1: Introduction</CardTitle>
                      <CardDescription>20 cards</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline">Study Now</Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Chapter 2: Key Concepts</CardTitle>
                      <CardDescription>15 cards</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline">Study Now</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  
    return (
      <div className="flex  h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white p-6 shadow-md">
          <div className="flex items-center mb-8">
            <Brain className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">YappingMind</h1>
          </div>
          <nav className="space-y-4">
            <a href="#" className="flex items-center text-gray-700 hover:text-primary">
              <FileText className="h-5 w-5 mr-3" />
              My Flashcards
            </a>
            <a href="#" className="flex items-center text-gray-700 hover:text-primary">
              <Users className="h-5 w-5 mr-3" />
              My Groups
            </a>
            <a href="#" className="flex items-center text-gray-700 hover:text-primary">
              <MessageCircle className="h-5 w-5 mr-3" />
              Discussions
            </a>
            <a href="/" className="flex items-center text-gray-700 hover:text-primary">
              <LogOut className="h-5 w-5 mr-3"/>
              Log Out
            </a>
          </nav>
        </aside>
  
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {user.username}</h2>
                <p className="text-gray-500">Ready to learn something new today?</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input className="pl-10 pr-4 py-2" placeholder="Search flashcards, groups, or users" />
            </div>
          </header>
  
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'flashcards' && renderFlashcards()}
          {activeView === 'group' && renderGroupRoom()}
  
          {/* Create Flashcard Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center p-6 border-b">
                  <h3 className="text-xl font-semibold">Create New Flashcard</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <div className="p-6">
                  <div className="space-y-4 mb-4">
                    <div>
                      <Label htmlFor="room-select">Select Room</Label>
                      <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                        <SelectTrigger id="room-select">
                          <SelectValue placeholder="Choose a room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Create New Room</SelectItem>
                          {myRooms.map((set) => (
                            <SelectItem key={set.room_id} value={set.room_id}>{set.room_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedRoom === "new" && (
                      <div>
                        <Label htmlFor="new-room-name">New Room Name</Label>
                        <Input
                          id="new-room-name"
                          value={newRoom.room_name}
                          onChange={(e) => { handleChangeRoom(e.target.value)}}
                          placeholder="Enter new room name"
                        />
                      </div>
                    )}
                  </div>
                  <RadioGroup value={creationMethod} onValueChange={setCreationMethod} className="mb-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual">Manual Creation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ai" id="ai" />
                      <Label htmlFor="ai">AI-Assisted Creation</Label>
                    </div>
                  </RadioGroup>
  
                  {creationMethod === 'manual' ? (
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="question">Question</Label>
                        <Textarea id="question" placeholder="Enter your question here" />
                      </div>
                      <div>
                        <Label htmlFor="answer">Answer</Label>
                        <Textarea id="answer" placeholder="Enter the answer here" />
                      </div>
                    </form>
                  ) : (
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="notes">Your Notes</Label>
                        <Textarea id="notes" placeholder="Paste your notes or text here for AI to generate flashcards" />
                      </div>
                    </form>
                  )}
  
                  <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={flashcardCreation}>Create Flashcard</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }
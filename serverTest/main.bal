import ballerina/io;
import ballerina/sql;
import ballerinax/mysql;
import ballerina/http;
import ballerina/os;


configurable string dbPassword = os:getEnv("DB_PASSWORD");


type UserRecord record {|
    string password;
    int user_id;
    string email;
    string username;
|};

type Note record {|
    int note_id;
    string note_content;
    boolean converted;
    string created_at;
    string updated_at;
    int user_id;
|};

type Room record {|
    int room_id;
    string room_name;
    string created_by;
    boolean is_public;
    string created_at;
|};

type FlashCard record {|
    int flashcard_id;
    int room_id;
    int created_by;
    string question;
    string answer;
    string source_doc;
    boolean ai_generated;
    // string? created_at;
    // string? note_id;
|};

type FlashCard2 record {|
    int flashcard_id;
    string question;
    string answer;
    string created_at;
    boolean ai_generated;
|};

type FlashNote record {|
    int flashcard_id;
    string question;
    string answer;
    string created_at;
    boolean ai_generated;
|};


type LastRoomRecordID record {|
    int room_id;
|};


type ResponseData record {|
    int note_id;
|};

type ErrorDetails record {|
    string error_type;
    string? sql_state?;
    string? sql_message?;
|};

type Status "success"|"error";

type Response record {|
    Status status;
    string message;
    ResponseData|ErrorDetails data;
|};

mysql:Client dbClient = check new (host = "localhost", user="root", password= dbPassword, database = "testdb");

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173"],
        allowCredentials: true,
        allowHeaders: ["Content-Type"],
        allowMethods: ["POST", "OPTIONS"]
    }
}
service / on new http:Listener(8080) {
    // Register user
    resource function post register(http:Caller caller, @http:Payload json payload) returns error?{
        string username = check payload.username.ensureType();
        string email = check payload.email.ensureType();
        string password = check payload.password.ensureType();
        string profilePicture = check payload.profilePicture.ensureType();
        boolean isAdmin = check payload.isAdmin.ensureType();

        

        check insertUserToDB(dbClient, username, email, password, profilePicture, isAdmin);
        UserRecord? userRecord = check getUserByUsername(username);

        http:Response res = new;
        if(userRecord is UserRecord){
            json cleanUserRecord = {
                "user_id": userRecord.user_id,
                "username": userRecord.username,
                "email": userRecord.email
            }; 
            io:println(cleanUserRecord);  
            res.setPayload(cleanUserRecord);
        } else {
            res.setPayload("User not found");
        }
        io:println(res.getTextPayload());
        setCORSHeaders(res);
        check caller->respond(res);
    }

    // Login user
    resource function post login(http:Caller caller, @http:Payload json payload) returns error? {
        string username = check payload.username.ensureType();
        string password = check payload.password.ensureType();
        UserRecord? userRecord = check getUserByUsername(username);
        
        http:Response res = new;
        if(userRecord is UserRecord){
            if password == userRecord.password{
                json cleanUserRecord = {
                    "user_id": userRecord.user_id,
                    "username": userRecord.username,
                    "email": userRecord.email
                }; 
                io:println(cleanUserRecord);  
                res.setPayload(cleanUserRecord);
            } else{
                res.setPayload("Invalid password");
            }
        } else {
            res.setPayload("User not found");
        }
        io:println(res.getTextPayload());
        setCORSHeaders(res);
        check caller->respond(res);
    }

    // Create Room
    resource function post createRoom(@http:Payload json payload, http:Caller caller) returns error? {
        string room_name = check payload.room_name.ensureType();
        int created_by = check payload.created_by.ensureType();
        int is_public = check payload.is_public.ensureType();

        http:Response res = new;
        setCORSHeaders(res);

        sql:ParameterizedQuery query = `CALL CreateRoom(${room_name}, ${created_by}, ${is_public})`;

        sql:ExecutionResult|sql:Error result = dbClient->execute(query);

        if result is sql:ExecutionResult {
            if result.affectedRowCount > 0 {
                //int generatedId = check result.lastInsertId;
                json successResponse = {
                    status: "success",
                    message: "Room created successfully",
                    room_name: room_name
                    //room_id: generatedId
                };
                res.setJsonPayload(successResponse);
                res.statusCode = http:STATUS_CREATED;
            } else {
                json errorResponse = {
                    status: "error",
                    message: "Failed to create room: No rows affected"
                };
                res.setJsonPayload(errorResponse);
                res.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
            }
        } else {
            json errorResponse = {
                status: "error",
                message: "Failed to create room: Database error",
                details: result.message()
            };
            res.setJsonPayload(errorResponse);
            res.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
        }
        setCORSHeaders(res);
        check caller->respond(res);
    }

    // Get Last RoomID

    resource function get lastRoomID(http:Caller caller) returns error? {
        sql:ParameterizedQuery query = `CALL GetLastRoom()`;

        stream<Room, sql:Error?> resultStream = dbClient->query(query);

        json[] resultArray = [];
        error? resultErr = resultStream.forEach(function(Room result){
            resultArray.push(result);
        });

        http:Response res = new;
        if(resultErr is error) {
            res.setPayload(resultErr.toString());
        } else {
            res.setPayload(resultArray.toString());
        }

        io:println(res.getTextPayload());
        check caller->respond(res);
    }
    
    // Get Rooms
    resource function get getMyRooms/[int user_id](http:Caller caller) returns error? {
        sql:ParameterizedQuery query = `CALL GetRoomsByUser(${user_id})`;

        stream<Room, sql:Error?> resultStream = dbClient->query(query);

        json[] resultArray = [];
        error? resultErr = resultStream.forEach(function(Room result){
            resultArray.push(result);
        });

        http:Response res = new;
        if(resultErr is error) {
            res.setPayload(resultErr.toString());
        } else {
            res.setPayload(resultArray.toString());
        }

        io:println(res.getTextPayload());
        check caller->respond(res);
    }
    // Create Flash Card
    resource function post createFlashcard(@http:Payload json payload, http:Caller caller) returns error? {
        int room_id = check payload.room_id.ensureType();
        int created_by = check payload.created_by.ensureType();
        string question = check payload.question.ensureType();
        string answer = check payload.answer.ensureType();
        string source_doc = check payload.source_doc.ensureType();
        boolean ai_generated = check payload.ai_generated.ensureType();

        http:Response res = new;
        setCORSHeaders(res);

        // Prepare the SQL query
        sql:ParameterizedQuery query = `CALL CreateFlashcard(${room_id}, ${created_by}, ${question}, ${answer}, ${source_doc}, ${ai_generated})`;

        sql:ExecutionResult|sql:Error result = dbClient->execute(query);

        if result is sql:ExecutionResult {
            if result.affectedRowCount > 0 {
                // int generatedId = <int>result.lastInsertId;
                json successResponse = {
                    status: "success",
                    message: "Flashcard created successfully"
                    // flashcard_id: generatedId
                };
                res.setJsonPayload(successResponse);
                res.statusCode = http:STATUS_CREATED;
            } else {
                json errorResponse = {
                    status: "error",
                    message: "Failed to create room: No rows affected"
                };
                res.setJsonPayload(errorResponse);
                res.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
            }
        } else {
            json errorResponse = {
                status: "error",
                message: "Failed to create room: Database error",
                details: result.message()
            };
            res.setJsonPayload(errorResponse);
            res.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
        }

        check caller->respond(res);
    }

    // Get Room Flash Cards
    resource function get roomFlashCards/[int room_id](http:Caller caller) returns error? {
        sql:ParameterizedQuery query = `CALL GetRoomFlashcards(${room_id})`;

        stream<FlashCard2, sql:Error?> resultStream = dbClient->query(query);

        json[] resultArray = [];
        error? resultErr = resultStream.forEach(function(FlashCard2 result){
            resultArray.push(result);
        });

        http:Response res = new;
        if(resultErr is error) {
            res.setPayload(resultErr.toString());
        } else{
            res.setPayload(resultArray.toString());
        }
        io:println(res.getTextPayload());
        setCORSHeaders(res);
        check caller->respond(res);
    }
    
    

    // Get User Notes
    resource function get notes/[int user_id](http:Caller caller) returns error? {
        sql:ParameterizedQuery query = `CALL GetUserNotes(${user_id})`;

        stream<Note, sql:Error?> resultStream = dbClient->query(query);

        json[] resultArray = [];
        error? resultErr = resultStream.forEach(function(Note result){
            resultArray.push(result);
        });

        http:Response res = new;
        if(resultErr is error) {
            res.setPayload(resultErr.toString());
        }else {
            res.setPayload(resultArray.toString());
        }

        setCORSHeaders(res);
        check caller->respond(res);
    }


    // Get Flash Cards From Notes
    resource function get flashCardFromNote(int note_id) returns json|error {
        sql:ParameterizedQuery query = `CALL GetFlashcardsFromNote(${note_id})`;

        stream<FlashNote, sql:Error?> resultStream = dbClient->query(query);

        json[] resultArray = [];
        error? resultErr = resultStream.forEach(function(FlashNote result){
            resultArray.push(result);
        });

        if(resultErr is error) {
            return resultErr;
        }
        return resultArray;
    }

    // Add User to Room
    resource function post addToRoom(@http:Payload json payload) returns json|error {
        int user_id = check payload.user_id.ensureType();
        int room_id = check payload.room_id.ensureType();

        check addUserToRoom(dbClient, user_id, room_id);
        return {
            "status": "success",
            "message": "User added to room successfully",
            "user_id": user_id,
            "room_id": room_id
        };
    }

    // Create Note
    resource function post createNote(@http:Payload json payload) returns json|error {
        int user_id = check payload.user_id.ensureType();
        string note_content = check payload.note_content.ensureType();

        check createNote(dbClient, user_id, note_content);
        return {
            "status": "success",
            "message": "Note successfully created.",
            "user_id": user_id,
            "note_content": note_content
        };
    }

    // Update Note
    resource function put updateNote(@http:Payload json payload) returns Response|error {
        int noteId;
        string noteContent;

        do {
            noteId = check payload.note_id.ensureType();
            noteContent = check payload.note_content.ensureType();

            if (noteId <= 0 || noteContent == "") {
                return {
                    status: "error",
                    message: "Invalid input: note_id must be a positive integer and note_content cannot be empty",
                    data: {
                        error_type: "InputValidationError"
                    }
                };
            }
        } on fail var e {
            return {
                status: "error",
                message: "Invalid input: " + e.message(),
                data: {
                    error_type: "InputParsingError"
                }
            };
        }

        return updateNote(dbClient, noteId, noteContent);
    }
}

function getUserByUsername(string username) returns UserRecord|error? {
    sql:ParameterizedQuery sqlQuery = `SELECT password, user_id, email, username FROM Users WHERE username = ${username}`;
    stream<UserRecord, sql:Error?> resultStream = dbClient->query(sqlQuery);

    UserRecord? userRecord;
    error? e = from UserRecord user in resultStream 
        do {
            userRecord = user;
            return userRecord;
        };
    check resultStream.close();
    return userRecord;
}
function insertUserToDB(mysql:Client dbClient, string username, string email, string password, string profilePicture, boolean isAdmin) returns error? {
    sql:ParameterizedQuery query = `INSERT INTO Users (username, email, password, profile_picture, is_admin) VALUES (${username}, ${email}, ${password}, ${profilePicture}, ${isAdmin})`;
    sql:ExecutionResult result = check dbClient->execute(query);
    if result.affectedRowCount > 0 {
        io:println("User created with ID: ", result.lastInsertId);
    } else {
        return error("User creation failed.");
    }
}

function addUserToRoom(mysql:Client dbClient, int user_id, int room_id) returns error? {
    sql:ParameterizedQuery query = `CALL AddUserToRoom(${user_id}, ${room_id})`;
    _= check dbClient->execute(query);
}

function createNote(mysql:Client dbClient, int user_id, string note_content) returns error? {
    sql:ParameterizedQuery query = `CALL CreateNote(${user_id}, ${note_content})`;
    _= check dbClient->execute(query);
}

function updateNote(mysql:Client dbClient, int noteId, string noteContent) returns Response {
    sql:ParameterizedQuery query = `CALL UpdateNote(${noteId}, ${noteContent})`;

    do {
        _ = check dbClient->execute(query);

        return {
            status: "success",
            message: "Note updated successfully",
            data: {
                note_id: noteId
            }
        };
    } on fail var e {
        if e is sql:DatabaseError {
            return {
                status: "error",
                message: "Failed to update note: Database error",
                data: {error_type: e.message()}
            };
        } 
        return {
            status: "error",
            message: "Failed to update note: " + e.message(),
            data: {
                error_type: "UnexpectedError"
            }
        };
    }
}


// Create flashcard in the database
function createFlashcard(mysql:Client dbClient, int room_id, int created_by, string question, string answer, string source_doc, boolean ai_generated) returns error? {
    sql:ParameterizedQuery query = `CALL CreateFlashcard(${room_id}, ${created_by}, ${question}, ${answer}, ${source_doc}, ${ai_generated})`;
    _ = check dbClient->execute(query);
}  


function setCORSHeaders(http:Response res) {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}


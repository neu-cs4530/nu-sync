import express, { Request, Response, Router } from 'express';
import {
    UserRequest,
    User,
    UserCredentials,
    UserByUsernameRequest,
    FakeSOSocket,
    UpdateBiographyRequest,
    GetMutualFriendsRequest,
} from '../types/types';
import querystring from 'querystring';
import axios from 'axios';


const spotifyController = (socket: FakeSOSocket) => {
    const router: Router = express.Router();

    const client_id: string = process.env.SPOTIFY_CLIENT_ID || ''
    // console.log(client_id)
    const client_secret: string = process.env.SPOTIFY_CLIENT_SECRET || ''
    const redirect_uri = process.env.REDIRECT_URI

    /**
     * Handles the initial authorization request of the spotify account.
     * @param req The request containing 
     * @param res The response, returning.
     * @returns A promise resolving to void.
     */
    const initiateLogin = async (req: Request, res: Response): Promise<void> => {
        var state = "TEST";
        var scope = 'user-read-private user-read-email';

        res.redirect('https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                state: state
            }));
    };


    /**
     * Handles the callback request of the spotify account.
     * @param req The request containing 
     * @param res The response, returning.
     * @returns A promise resolving to void.
     */
    const callbackFunc = async (req: Request, res: Response): Promise<void> => {
        var code = req.query.code || null;
        var state = req.query.state || null;

        if (state === null) {
            res.redirect('/#' +
                querystring.stringify({
                    error: 'state_mismatch'
                }));
        } else {
            var authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                form: {
                    code: code,
                    redirect_uri: redirect_uri,
                    grant_type: 'authorization_code'
                },
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
                },
                json: true
            };
        }
    };



    

    // Define routes for the user-related operations.
    router.get('/auth/spotify', initiateLogin);
    router.get('/auth/callback', callbackFunc);
    return router;
};

export default spotifyController;

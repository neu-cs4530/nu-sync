import UserModel from "../models/users.model";

const isSpotifyLinkedToAnotherUser = async (
    spotifyId: string,
    currentUsername: string,
): Promise<boolean> => {
    const existingUser = await UserModel.findOne({
        spotifyId,
        username: { $ne: currentUsername },
    });

    return !!existingUser;
};

export default isSpotifyLinkedToAnotherUser;
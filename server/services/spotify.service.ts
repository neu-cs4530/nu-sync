import UserModel from "../models/users.model";

export const isSpotifyLinkedToAnotherUser = async (
    spotifyId: string,
    currentUsername: string,
): Promise<boolean> => {
    const existingUser = await UserModel.findOne({
        spotifyId,
        username: { $ne: currentUsername },
    });

    return !!existingUser;
};
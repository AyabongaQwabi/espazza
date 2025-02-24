import { NextResponse } from 'next/server';
import { jwtDecrypt } from 'jose';
import { FacebookAdsApi, Page } from 'facebook-nodejs-business-sdk';
import play from 'play-dl';

const SECRET_KEY = new Uint8Array(32);
const keyMaterial = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_SECRET_KEY
);
SECRET_KEY.set(keyMaterial.slice(0, 32));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { video } = body;
    console.log('Token:', body);

    const { payload } = await jwtDecrypt(video, SECRET_KEY, {
      algorithms: ['dir'],
    });
    console.log('Payload:', payload);
    const { youtubeLink, promotionalText, userId, username } = payload;

    // Validate input
    if (!youtubeLink || !promotionalText || !userId || !username || !video) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get video info
    const videoInfo = await play.video_info(youtubeLink);
    if (!videoInfo) {
      throw new Error('Could not get video information');
    }

    console.log('Video formats available:', videoInfo.format);

    // Get video stream with highest quality
    const stream = await play.stream_from_info(videoInfo);

    if (!stream) {
      throw new Error('Could not get video stream');
    }

    // Initialize Facebook API
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!accessToken || !pageId) {
      throw new Error('Facebook credentials are missing');
    }

    const api = FacebookAdsApi.init(accessToken);
    const page = new Page(pageId);

    // Prepare post content
    const postDescription = `${promotionalText}\n\n${
      videoInfo.video_details.description || ''
    }\n\n[ eSpazza YT Promotion by @${username} ]`;

    // Post to Facebook
    const response = await page.createVideo({
      description: postDescription,
      title: videoInfo.video_details.title,
      source: stream.stream,
    });

    console.log('Facebook API response:', response);

    return NextResponse.json(
      { message: 'Video promoted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error promoting video:', error);
    return NextResponse.json(
      {
        message: 'Failed to promote video',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

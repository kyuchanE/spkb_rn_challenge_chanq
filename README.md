# spkb_rn_challenge_chanq

TypeScript와 Expo Router를 사용하는 React Native 프로젝트입니다. 공식 [`create-expo-app`](https://docs.expo.dev/get-started/create-a-project/) 기본 템플릿으로 생성했습니다.

- Expo SDK 58 / React Native 0.88 / React 19.3
- Node.js 22.13 이상인 22.x LTS 또는 React Native가 지원하는 Node.js 버전 사용
- 패키지 매니저: npm (`package-lock.json`을 커밋하고, 저장소를 받은 뒤 `npm ci`로 설치)

```bash
npm start          # Expo 개발 서버
npm run android   # Android 에뮬레이터
npm run ios       # iOS 시뮬레이터
npm run web       # 웹
npm run lint      # ESLint
npm run typecheck # TypeScript 타입 검사
```

## Git 관리 규칙

`.gitignore`는 의존성, Expo 캐시, 빌드 결과물, 환경 변수, 서명 파일을 제외합니다. `.env.example`과 `.env.*.example`은 추적할 수 있으므로 실제 비밀값 없이 설정 예시만 작성하세요.

현재는 Expo Continuous Native Generation을 사용하므로 `/ios`, `/android`를 제외합니다. 네이티브 설정은 `app.json`과 config plugin에서 관리합니다. 추후 네이티브 프로젝트를 직접 유지하기로 결정하면 해당 제외 규칙을 제거하고 네이티브 소스를 커밋하세요.

라우트는 `src/app/`에, 공통 UI와 훅은 `src/components/`, `src/hooks/`에 둡니다.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

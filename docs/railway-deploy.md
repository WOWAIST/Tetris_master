# Railway Deploy

## 서비스 구성

- Railway 단일 서비스로 배포합니다.
- `railway.json`의 build command가 프론트엔드 빌드 후 Spring Boot jar를 생성합니다.
- Spring Boot jar 안에 `frontend/dist` 결과물이 정적 리소스로 포함됩니다.

## 환경 변수

Railway 서비스에 아래 값을 설정합니다.

```env
MYSQLHOST=
MYSQLPORT=3306
MYSQLDATABASE=tetris
MYSQLUSER=
MYSQLPASSWORD=
GITHUB_TOKEN=
```

Railway MySQL 플러그인을 쓰는 경우 `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD` 값은 Railway가 제공하는 값을 연결하면 됩니다.

## 배포

`main` 브랜치에 push하면 GitHub Actions의 `Deploy` workflow가 Railway 배포를 실행합니다.

로컬에서 같은 빌드 흐름을 확인하려면 아래 명령을 실행합니다.

```sh
cd frontend
npm ci
npm run build
cd ../backend
./gradlew clean bootJar
```

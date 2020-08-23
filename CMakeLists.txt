cmake_minimum_required(VERSION 3.16)
project(gamelift.io)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)
# https://cmake.org/cmake/help/latest/prop_tgt/CXX_STANDARD.html
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(FetchContent)

FetchContent_Declare(com_github_protocolbuffers_protobuf
    URL https://github.com/protocolbuffers/protobuf/archive/v3.3.2.zip
    URL_HASH SHA256=c895ad9fd792532f233ced36969d9cc4daec5cb7de9db0d9b26cf06ccd0183c1
)
FetchContent_GetProperties(com_github_protocolbuffers_protobuf)
set(protobuf_BUILD_TESTS FALSE)
if(NOT com_github_protocolbuffers_protobuf_POPULATED)
    FetchContent_Populate(com_github_protocolbuffers_protobuf)

    add_subdirectory(${com_github_protocolbuffers_protobuf_SOURCE_DIR}/cmake)
endif()
set(PROTOBUF_SOURCE_DIR ${com_github_protocolbuffers_protobuf_SOURCE_DIR} CACHE FILEPATH "Filepath to Protocol Buffer repository archive contents.")

FetchContent_Declare(com_amazonaws_gamelift
    URL https://gamelift-release.s3-us-west-2.amazonaws.com/GameLift_04_16_2020.zip
    URL_HASH SHA256=5f55d510218d755e37b70eb7aa30f8f7a3554a8e5f8ec5f2f789cd6a5536f348
)
FetchContent_GetProperties(com_amazonaws_gamelift)
if(NOT com_amazonaws_gamelift_POPULATED)
    FetchContent_Populate(com_amazonaws_gamelift)
endif()
set(GAMELIFT_SOURCE_DIR ${com_amazonaws_gamelift_SOURCE_DIR} CACHE FILEPATH "Filepath to GameLift Server SDK zip file contents.")

add_library(gamelift.io-pb STATIC)
target_link_libraries(gamelift.io-pb PUBLIC libprotobuf)
target_include_directories(gamelift.io-pb PUBLIC
    # ${PROTOBUF_SOURCE_DIR}/src
    ${GAMELIFT_SOURCE_DIR}/GameLift-SDK-Release-4.0.0/GameLift-Cpp-ServerSDK-3.4.0/gamelift-server-sdk/source/aws/gamelift/server/protocols
)
target_sources(gamelift.io-pb PRIVATE
    ${GAMELIFT_SOURCE_DIR}/GameLift-SDK-Release-4.0.0/GameLift-Cpp-ServerSDK-3.4.0/gamelift-server-sdk/source/aws/gamelift/server/protocols/sdk.pb.cc
)

add_library(${PROJECT_NAME} SHARED)

set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "")
set_target_properties(${PROJECT_NAME} PROPERTIES OUTPUT_NAME "gamelift")
set_target_properties(${PROJECT_NAME} PROPERTIES SUFFIX ".node")

target_compile_definitions(${PROJECT_NAME} PUBLIC NAPI_VERSION=6)
target_link_libraries(${PROJECT_NAME} PUBLIC gamelift.io-pb)

# Include N-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME} PUBLIC
    /usr/include/node
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_include_directories(${PROJECT_NAME} PRIVATE ${NODE_ADDON_API_DIR})

target_sources(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src/gamelift.cc
    ${CMAKE_CURRENT_SOURCE_DIR}/src/accept-player-session.cc
    ${CMAKE_CURRENT_SOURCE_DIR}/src/game-property.cc
    ${CMAKE_CURRENT_SOURCE_DIR}/src/game-session.cc
    ${CMAKE_CURRENT_SOURCE_DIR}/src/process-ready.cc
)

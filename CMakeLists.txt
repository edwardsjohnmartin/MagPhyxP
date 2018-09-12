cmake_minimum_required (VERSION 2.6)
project (MAGPHYX)

SET(CMAKE_MODULE_PATH ${PROJECT_SOURCE_DIR}/cmake)

#------------------------------------------------------------
# Use C++ 2011
#------------------------------------------------------------
if(WIN32)
  message(STATUS "Please verify you are using a compiler with C++11 support.")
else()
  include(CheckCXXCompilerFlag)
  CHECK_CXX_COMPILER_FLAG("-std=c++11" COMPILER_SUPPORTS_CXX11)
  CHECK_CXX_COMPILER_FLAG("-std=c++0x" COMPILER_SUPPORTS_CXX0X)
  if(COMPILER_SUPPORTS_CXX11)
  	set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
  elseif(COMPILER_SUPPORTS_CXX0X)
  	set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++0x")
  else()
          message(STATUS "The compiler ${CMAKE_CXX_COMPILER} has no C++11 support. Please use a different C++ compiler.")
  endif()
endif()

set(EXECUTABLE_OUTPUT_PATH "${CMAKE_BINARY_DIR}")

#------------------------------------------------------------
# Source files
#------------------------------------------------------------
SET(SRCS
  ./Options.cpp
  ./main.cpp
  ./magphyxp_impl.cpp
)

#------------------------------------------------------------
# Header include directories
#------------------------------------------------------------
SET(INCL
    ./
)
INCLUDE_DIRECTORIES(${INCL})

ADD_DEFINITIONS(-DANSI_DECLARATORS)
ADD_DEFINITIONS(-U__STRICT_ANSI__)


IF(APPLE)
  ADD_DEFINITIONS(-D__MAC__ -DAPPLE)
ENDIF(APPLE)

ADD_EXECUTABLE(magphyxp ${SRCS})
#set_target_properties (magphyx PROPERTIES COMPILE_DEFINITIONS "OCT2D")
TARGET_LINK_LIBRARIES(magphyxp gsl gslcblas m)
#TARGET_LINK_LIBRARIES(magphyx glfw ${GLFW_LIBRARIES} ${OPENGL_LIBRARIES} ${GLEW_LIBRARIES} ${OPENCL_LIBRARY})

all: clean
	swig -c++ -python MagPhyxP.i
#	gcc -std=c++0x -c Options.cpp magphyxp.cpp magphyxp_impl.cpp magphyxp_wrap.cxx -I/Users/edwajohn/anaconda3/include/python3.6m
#	CC=$CXX
#	CC=g++
#	CXX=g++
	python setup.py build_ext --inplace
clean:
	rm -f *.o
	rm -f magphyxp_wrap.cxx
	rm -rf __pycache__
	rm -rf build
	rm -f *.so
	rm -f magphyxp.py

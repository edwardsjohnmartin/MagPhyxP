from distutils.core import setup, Extension
import os

# the c++ extension module
#extension_mod = Extension("_magphyxp", 
#                          sources=["magphyxp_wrap.cxx", "magphyxp.cpp"])

os.environ["CC"] = "g++"
os.environ["CXX"] = "g++"
os.environ["CXXFLAGS"] = "-std=c++11"
os.environ["CPPFLAGS"] = "-std=c++11"

extension_mod = Extension(
    "_magphyxp", 
    language='c++',
    # include_dirs=['/Users/edwajohn/anaconda3/include/python3.6m'],
    sources=["Options.cpp", "MagPhyxP_wrap.cxx", "magphyxp.cpp", "magphyxp_impl.cpp"],
    extra_compile_args=['-std=c++11'],
    libraries=['gsl', 'gslcblas', 'm']
)

setup(name = "magphyxp", ext_modules=[extension_mod])


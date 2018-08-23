/*******************************************************
 ** Generalized Voronoi Diagram Project               **
 ** Copyright (c) 2016 John Martin Edwards            **
 ** Idaho State University                            **
 **                                                   **
 ** For information about this project contact        **
 ** John Edwards at                                   **
 **    edwajohn@isu.edu                               **
 ** or visit                                          **
 **    http://www2.cose.isu.edu/~edwajohn/            **
 *******************************************************/

#include <algorithm>
#include <cstring>
#include <fstream>
#include <sstream>
#include <iostream>
#if defined (WIN32)
	#include <functional>
#endif

#include "./Options.h"
#include "./Physics.h"

using namespace std;

// Global Options object
// Options options;

// You could also take an existing vector as a parameter.
vector<string> split(string str, char delimiter) {
  vector<string> internal;
  stringstream ss(str); // Turn the string into a stream.
  string tok;
  
  while(getline(ss, tok, delimiter)) {
    internal.push_back(tok);
  }
  
  return internal;
}
/*
Dipole initDipole(const string& filename) {
  ifstream in(filename.c_str());
  string line;
  vector<string> tokens;

  // skip header line
  getline(in, line, '\r');
  // cout << line << endl;
  tokens = split(line, ',');
  if (tokens[0].compare("n") != 0) {
    throw logic_error("Illegal file");
  }
  
  // first data line
  getline(in, line, '\r');
  // cout << line << endl;
  tokens = split(line, ',');
  int i = 0;
  // cout << tokens[i] << endl;
  const int n = stoi(tokens[i++]);
  const string event_type = tokens[i++];
  const double t = stod(tokens[i++]);
  const double r = stod(tokens[i++]);
  const double theta = Physics::deg2rad(stod(tokens[i++]));
  const double phi = Physics::deg2rad(stod(tokens[i++]));
  const double pr = stod(tokens[i++]);
  const double ptheta = stod(tokens[i++]);
  const double pphi = stod(tokens[i++]);
  const double beta = stod(tokens[i++]);
  const double E = stod(tokens[i++]);
  const double dE = stod(tokens[i++]);

  return Dipole(r, theta, phi, pr, ptheta, pphi);
}

bool Options::ProcessArg(int& i, char** argv) {
  Options& o = *this;
  int orig_i = i;
  if (strcmp(argv[i], "--numEvents") == 0) {
    ++i;
    o.numEvents = (int)atof(argv[i]);
    ++i;
  } else if (strcmp(argv[i], "--logOfNumSteps") == 0) {
    ++i;
    o.numSteps = (int)pow(2, (int)atof(argv[i]));
    o.numEvents = -1;
    ++i;
  } else if (strcmp(argv[i], "-h") == 0) {
    ++i;
    o.h = atof(argv[i]);
    ++i;
  } else if (strcmp(argv[i], "-c") == 0) {
    ++i;
    o.fixed_h = true;
  } else if (strcmp(argv[i], "-e") == 0) {
    ++i;
    o.eps = atof(argv[i]);
    ++i;
  } else if (strcmp(argv[i], "-f") == 0) {
    ++i;
    o.dipole = initDipole(argv[i]);
    o.initialized = true;
    ++i;
  } else if (strcmp(argv[i], "--fft") == 0) {
    ++i;
    o.fft = true;
  } else if (strcmp(argv[i], "-i") == 0) {
    ++i;
    // const double r = atof(argv[i++]);
    const double r = 1;
    // const double theta = Physics::deg2rad(atof(argv[i++]));
    const double theta = 0.0;
    // const double phi = Physics::deg2rad(atof(argv[i++]));
    const double phi = 0.0;
    // const double pr = atof(argv[i++]);
    const double ptheta = atof(argv[i++]);
    const double pphi = atof(argv[i++]);
    // -----------------------------
    const double E = atof(argv[i++]);
    const double pr = sqrt(abs(2*E + (cos(phi)+3*cos(phi-2*theta))/(6*r*r*r)-ptheta*ptheta/(r*r)-10*pphi*pphi));
    // -----------------------------
    o.dipole = Dipole(r, theta, phi, pr, ptheta, pphi);
    o.initialized = true;
  } else if (strcmp(argv[i], "-ss") == 0) {
    ++i;
    const double r = atof(argv[i++]);
    const double theta = Physics::deg2rad(atof(argv[i++]));
    const double phi = Physics::deg2rad(atof(argv[i++]));
    const double pr = atof(argv[i++]);
    const double ptheta = atof(argv[i++]);
    const double pphi = atof(argv[i++]);
    o.dipole = Dipole(r, theta, phi, pr, ptheta, pphi);
    o.initialized = true;
    o.singleSimulation = true;
  } else if (strcmp(argv[i], "-d") == 0) {
    ++i;
    if (string(argv[i]) == "bouncing") {
      o.dynamics = BOUNCING;
    } else if (string(argv[i]) == "sliding") {
      o.dynamics = SLIDING;
    } else {
      fprintf(stderr, "Illegal value for dynamics type. Legal values are "
              "\"bouncing\" and \"sliding\"");
      return false;
    }
    ++i;
  } else if (strcmp(argv[i], "-o") == 0) {
    ++i;
    outFilename = argv[i];
    ++i;
  } else if (strcmp(argv[i], "-s") == 0) {
    ++i;
    if (string(argv[i]) == "theta") {
      o.singleStep = THETA;
    } else if (string(argv[i]) == "phi") {
      o.singleStep = PHI;
    } else if (string(argv[i]) == "all") {
      o.singleStep = ALL;
    } else {
      fprintf(stderr, "Illegal value for single step state value."
              "Legal values are \"theta\" and \"phi\"");
      return false;
    }
    ++i;
  } else if (strcmp(argv[i], "-I") == 0) {
    ++i;
    o.interactive = true;
  }
  return i != orig_i;
}
*/
// trim from start
string& ltrim(string &s) {
  s.erase(s.begin(), find_if(s.begin(),
                             s.end(), not1(ptr_fun<int, int>(isspace))));
  return s;
}

// trim from end
string& rtrim(string &s) {
  s.erase(find_if(s.rbegin(), s.rend(),
                  not1(ptr_fun<int, int>(isspace))).base(), s.end());
  return s;
}

// trim from both ends
string& trim(string &s) {
  return ltrim(rtrim(s));
}

void Options::ReadOptionsFile() {
  ifstream in("gvd.config");
  if (!in) return;
  while (!in.eof()) {
    string key;
    in >> key;
    string value;
    getline(in, value);
    
    if (!key.empty() && key[0] != '#')
      key2value[key] = trim(value);
  }
  in.close();
}

string Options::Value(
    const string& key, const string& default_value) const {
  if (key2value.find(key) == key2value.end())
    return default_value;
  const string value = key2value.find(key)->second;
  return value;
}

bool Options::BoolValue(
    const string& key, const bool default_value) const {
  const string value = Value(key, default_value?"true":"false");
  if (value == "0" || value == "false" || value == "False" || value == "FALSE")
    return false;
  return true;
}

int Options::IntValue(
    const string& key, const int default_value) const {
  stringstream ss;
  ss << default_value;
  const string value = Value(key, ss.str());
  return atoi(value.c_str());
}


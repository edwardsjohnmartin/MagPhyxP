#ifndef __EVENT_H__
#define __EVENT_H__

#include <gsl/gsl_fft_real.h>

#include "./Dipole.h"
#include "./Options.h"
#include "./Physics.h"

class Event {
 public:
  Event(const std::string& filename, const Dipole& d,
        const Options::StateVariable& singleStep)
      : _n(1), _d(d), _singleStep(singleStep) {
    _isStdout = (filename == "");
    if (_isStdout) {
      _file = stdout;
    } else {
      _file = fopen(filename.c_str(), "w");
    }
  }

  ~Event() {
    if (_singleStep != Options::NONE && _singleStep != Options::ALL) {
      if (o.fft) {
        gsl_fft_real_radix2_transform(_ss_v.data(), 1, _ss_v.size());
        // // Print complex result
        // const int n = _ss_t.size();
        // fprintf(_file, "%lf %lf %lf\n", _ss_t[0], _ss_v[0], 0.0);
        // for (int i = 1; i < n/2; ++i) {
        //   fprintf(_file, "%lf %lf %lf\n", _ss_t[i], _ss_v[i], _ss_v[n-i]);
        // }
        // fprintf(_file, "%lf %lf %lf\n", _ss_t[n/2], _ss_v[n/2], 0.0);
        // for (int i = n/2+1; i < n; ++i) {
        //   fprintf(_file, "%lf %lf %lf\n", _ss_t[i], _ss_v[n-i], -_ss_v[i]);
        // }
        // Print power spectrum
        const int n = _ss_t.size();
        fprintf(_file, "%lf %lf\n", _ss_t[0], sq(_ss_v[0], 0));
        for (int i = 1; i < n/2; ++i) {
          fprintf(_file, "%lf %lf\n", _ss_t[i], sq(_ss_v[i], _ss_v[n-i]));
        }
        fprintf(_file, "%lf %lf\n", _ss_t[n/2], sq(_ss_v[n/2], 0.0));
        for (int i = n/2+1; i < n; ++i) {
          fprintf(_file, "%lf %lf\n", _ss_t[i], sq(_ss_v[n-i], -_ss_v[i]));
        }
      } else {
        for (int i = 0; i < _ss_t.size(); ++i) {
          fprintf(_file, "%lf %lf\n", _ss_t[i], _ss_v[i]);
        }
      }
    }

    if (!_isStdout) {
      fclose(_file);
    }
  }

  // Returns the square of the complex number a+ib where the square
  // is (a+ib)x(a+ib)* where * denotes the conjugate.
  static inline double sq(const double a, const double b) {
    return a*a+b*b;
  }

  // private:
  // disallow copies because destructor closes file
  void operator=(const Event& e) {
  }

 public:
  void printHeader() const {
    if (_singleStep == Options::NONE || _singleStep == Options::ALL) {
      fprintf(_file, "n, event_type, t, r, theta, phi,"
              "pr, ptheta, pphi, beta, E, dE\n");
    }
  }

  int get_n() const { return _n; }
  void set_n(int n) { _n = n; }

  void printInitState(const Dipole& new_d, const double t) {
    const Dipole logDipole = new_d;
    event("init", logDipole, t);
  }

  bool log(const Dipole& new_d, const double t) {
    if (_singleStep != Options::NONE) {
      _ss_t.push_back(t);
      if (_singleStep == Options::THETA) {
        _ss_v.push_back(new_d.get_theta());
      } else if (_singleStep == Options::PHI) {
        _ss_v.push_back(new_d.get_phi());
      } else if (_singleStep == Options::ALL) {
        event("step", new_d, t);
      }
      return true;
    }

    bool fired = false;
    // Log zero crossings
    if (isZeroCrossing(_d.get_theta(), new_d.get_theta())) {
      const Dipole logDipole = Dipole::interpolateZeroCrossing(
          _d, new_d, [](const Dipole& d) {return d.get_theta();});
      event("theta = 0", logDipole, t);
      fired = true;
    }
    if (isZeroCrossing(_d.get_phi(), new_d.get_phi())) {
      const Dipole logDipole = Dipole::interpolateZeroCrossing(
          _d, new_d, [](const Dipole& d) {return d.get_phi();});
      event("phi = 0", logDipole, t);
      fired = true;
    }
    if (isZeroCrossing(Physics::get_beta(_d), Physics::get_beta(new_d))) {
      const Dipole logDipole = Dipole::interpolateZeroCrossing(
          _d, new_d, [](const Dipole& d) {return Physics::get_beta(d);});
      event("beta = 0", logDipole, t);
      fired = true;
    }
    if (isNegativeZeroCrossing(_d.get_pr(), new_d.get_pr())) {
      const Dipole logDipole = Dipole::interpolateZeroCrossing(
          _d, new_d, [](const Dipole& d) {return d.get_pr();});
      event("pr = 0", logDipole, t);
      fired = true;
    }
    if (isZeroCrossing(_d.get_ptheta(), new_d.get_ptheta())) {
      const Dipole logDipole = Dipole::interpolateZeroCrossing(
          _d, new_d, [](const Dipole& d) {return d.get_ptheta();});
      event("ptheta = 0", logDipole, t);
      fired = true;
    }
    if (isZeroCrossing(_d.get_pphi(), new_d.get_pphi())) {
      const Dipole logDipole = Dipole::interpolateZeroCrossing(
          _d, new_d, [](const Dipole& d) {return d.get_pphi();});
      event("pphi = 0", logDipole, t);
      fired = true;
    }
    _d = new_d;
    return fired;
  }

  void logCollision(const Dipole& new_d, const double t) {
    if (_singleStep != Options::NONE) {
      throw std::logic_error("Collision events should not occur in single step "
                             "mode");
    }

    event("collision", new_d, t);
    _d = new_d;
  }

 private:
  void event(const std::string& name, const Dipole& d, const double t) {
    fprintf(_file, "%d,%s,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%.2e\n",
            _n, name.c_str(), t, d.get_r(),
            Physics::rad2deg(d.get_theta()), Physics::rad2deg(d.get_phi()),
            d.get_pr(), d.get_ptheta(), d.get_pphi(), Physics::get_beta(d),
            d.get_E(), d.get_dE());
    _n++;
  }

  static int sign(const double d) {
    const double EPSILON = 0.000000000001;
    return (d < -EPSILON) ? -1 : (d > EPSILON) ? 1 : 0;
  }

  static bool isZeroCrossing(const double a, const double b) {
    // Return true if we cross zero or if we move from non-zero to zero.
    if (sign(a) == 0) return false;
    return (sign(a) == -sign(b)) || (sign(b) == 0);
  }

  static bool isNegativeZeroCrossing(const double a, const double b) {
    // Return true if we cross zero from positive to negative or from
    // zero to negative.
    return (sign(a) > 0 && sign(b) <= 0);
  }

 private:
  FILE* _file;
  bool _isStdout;
  int _n;
  Dipole _d;
  const Options::StateVariable _singleStep;
  // Single-step t and variable values.
  std::vector<double> _ss_t;
  std::vector<double> _ss_v;
};

#endif

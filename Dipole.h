/*******************************************************
 ** MagPhyx Project                                   **
 ** Copyright (c) 2016 John Martin Edwards            **
 ** Idaho State University                            **
 **                                                   **
 ** For information about this project contact        **
 ** John Edwards at                                   **
 **    edwajohn@isu.edu                               **
 ** or visit                                          **
 **    http://www2.cose.isu.edu/~edwajohn/            **
 *******************************************************/

#ifndef __DIPOLE_H__
#define __DIPOLE_H__

#include <iostream>
#include <math.h>

#include "./vec.h"

// Dipole has properties r, theta, phi, pr, ptheta, pphi
class Dipole {
 public:
  Dipole() {
    _r = 1.5;
    _theta = 0;
    _phi = 0;
    _pr = 0;
    _ptheta = 0;
    _pphi = 0;

    _E0 = get_E();
  }

  Dipole(const double r, const double theta, const double phi,
         const double pr, const double ptheta, const double pphi) {
    _r = r;
    _theta = theta;
    _phi = phi;
    _pr = pr;
    _ptheta = ptheta;
    _pphi = pphi;

    _E0 = get_E();
  }

  double get_r() const { return _r; }
  double get_theta() const { return _theta; }
  double get_phi() const { return _phi; }
  double get_pr() const { return _pr; }
  double get_ptheta() const { return _ptheta; }
  double get_pphi() const { return _pphi; }
  // double get_E0() const { return _E0; }
  double get_dE() const { return fabs(_E0-get_E()); }

  void set_r(const double r) { _r = r; }
  void set_theta(const double theta) { _theta = theta; }
  void set_phi(const double phi) { _phi = phi; }
  void set_pr(const double pr) { _pr = pr; }
  void set_ptheta(const double ptheta) { _ptheta = ptheta; }
  void set_pphi(const double pphi) { _pphi = pphi; }

  // Specific magnetic field computation with source moment at (1, 0, 0)
  // Computes the magnetic field at position p.
  // m points south to north
  // dipole is sphere
  // n spheres of diameter d. For each sphere, specify m orientation.
  // Torque on dipole will twist m.
  static double3 B(const double3& p) {
    const double r = length(p);
    if (r == 0) {
      throw std::logic_error("No magnetic field at origin");
    }
    const double r2 = r*r;
    const double c = 1 / 6;
    const double3 mr = mult(p, 3 * p[0] / (r2*r2*r));
    const double3 mm = make_double3(1.0 / (r2*r), 0, 0);
    return mult(subtract(mr, mm), c);
  }

  static Dipole interpolateZeroCrossing(
      const Dipole& src, const Dipole& target, double f(const Dipole&)) {
    const double EPSILON = 0.000000000001;
    const double srcValue = f(src);
    const double targetValue = f(target);
    double t = (-srcValue) / (targetValue - srcValue);
    if (fabs(targetValue - srcValue) < EPSILON) {
      t = 0;
    }
    const double r = src.get_r() + t * (target.get_r() - src.get_r());
    const double theta =
        src.get_theta() + t * (target.get_theta() - src.get_theta());
    const double phi = src.get_phi() + t * (target.get_phi() - src.get_phi());
    const double pr = src.get_pr() + t * (target.get_pr() - src.get_pr());
    const double ptheta =
        src.get_ptheta() + t * (target.get_ptheta() - src.get_ptheta());
    const double pphi =
        src.get_pphi() + t * (target.get_pphi() - src.get_pphi());

    Dipole ret(r, theta, phi, pr, ptheta, pphi);
    ret._E0 = src._E0;
    return ret;
  }

  double get_E() const {
    return T() + V();
  }

 private:
  //----------------------------------------
  // Energy
  //----------------------------------------

  double T() const {
    return _pr*_pr/2 + _ptheta*_ptheta/(2*_r*_r) + 5*_pphi*_pphi;
  }

  double V() const {
    return -(cos(_phi) + 3*cos(_phi-2*_theta))/(12*_r*_r*_r);
  }

 private:
  double _r;
  double _theta;
  double _phi;
  double _pr;
  double _ptheta;
  double _pphi;
  double _E0;
};
// Dipole.prototype.updateFromRK = function(rk, updateP, updateM) {
//   this.update(rk.p, rk.v, rk.theta, rk.omega, updateP, updateM);
// }

// Dipole.prototype.update = function(p, v, phi, omega, updateP, updateM) {
//   if (updateP) {
//     this.p = p;
//     this.v = v;
//   }
//   if (updateM) {
//     this.m = vec3(Math.cos(phi), Math.sin(phi), 0);
//     this.av = omega;
//   }
// }

// Dipole.prototype.copy = function() {
//   var d = new Dipole(this.p, this.m, this.fixed);
//   d.v = this.v;
//   d.av = this.av;
//   d.E0 = this.E0;
//   return d;
// }

// // Dipole.prototype.interpolate = function(t, src, target) {
// //   this.p = add(src.p, mult(t, subtract(target.p, src.p)));
// //   this.m = add(src.m, mult(t, subtract(target.m, src.m)));
// //   this.v = add(src.v, mult(t, subtract(target.v, src.v)));
// //   this.av = src.av + t*(target.av-src.av);
// // }


#endif
